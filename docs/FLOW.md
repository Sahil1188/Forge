# Forge — Code Flow Walkthrough

This document traces the system **end to end, in the order code actually runs**, naming the file
responsible at each step. Read it top-to-bottom once and the whole codebase makes sense. Each
folder also has its own `README.md` describing every file in it.

Legend: `path/to/file.ts` → what happens there.

---

## 0. Boot

```
src/main.ts                          → creates the Nest app, global validation, starts HTTP
 └─ src/app.module.ts                → the module graph: imports every feature module
     ├─ infrastructure/database/*    → connects to PostgreSQL (Drizzle) — see its README
     └─ infrastructure/events/*      → outbox table + in-process EventBus + dispatcher
```

Everything below is a feature module wired into `app.module.ts`. Data lives in PostgreSQL via
Drizzle; every `*.schema.ts` is re-exported by `infrastructure/database/schema.ts` (the barrel that
`drizzle-kit` reads to generate migrations in `drizzle/`).

---

## 1. Set up the organization (human-driven REST)

```
POST /companies                      → modules/companies/companies.controller.ts
 └─ companies.service.ts             → inserts a company row (companies.schema.ts)

POST /companies/:id/employees        → modules/employees/employees.controller.ts
 └─ employees.service.ts             → creates the employee + its runtime config + skills
                                        (employees.schema.ts holds ModelPolicy — the Omni Router input)
```

An **employee** is a database record (identity, role, manager, runtime config, skills, governance),
never a running process. `runtimeConfig.runtimeKey` decides which runtime executes its work
(`claude_code` for CEO/leads, `custom` for workers); `runtimeConfig.modelPolicy` feeds the Omni Router.

---

## 2. Define the work (human-driven REST)

```
POST /companies/:id/goals            → modules/goals/goals.controller.ts → goals.service.ts
POST /goals/:id/projects             → modules/projects/projects.controller.ts → projects.service.ts
POST /projects/:id/work-items        → modules/work/work.controller.ts → work.service.ts
```

Every write happens inside a DB transaction that **also inserts an event row** via
`infrastructure/events/outbox.service.ts` (the transactional outbox). The work item's lifecycle is
guarded by the pure state machine in `modules/work/work-status.ts`.

---

## 3. Start the goal → the CEO plans (the autonomous entry point)

```
POST /goals/:id/start                → goals.service.ts (emits goal.started to the outbox)
     │
     │  (prod) infrastructure/events/outbox.dispatcher.ts publishes goal.started to the EventBus
     ▼
modules/heartbeats/heartbeat.worker.ts   → onGoalStarted(): records a heartbeat, invokes the planner
 └─ modules/heartbeats/ceo-planner.service.ts
      1. finds the CEO employee (by role / org root)
      2. runs the CEO through its runtime (a goal-level agent_run + workspace)
      3. the CEO writes PLAN.json into its workspace
      4. reads PLAN.json → creates a project + work items
      5. routes each work item (see §4)
```

The heartbeat is the "wake the agent" trigger (spec §11). Planning is a **goal-level run** — that's
why `agent_runs`/`workspaces` allow a `goalId` with a null `workItemId`.

---

## 4. Who does it? — the Workforce Router

```
router.route({ companyId, taskType })            → modules/routing/workforce/scoring-workforce-router.service.ts
 └─ modules/routing/workforce/candidate-scoring.ts   → pure scoring: skill + role + availability
                                                        (reputation is an input, weight 0 in V1)
```

The best-fit employee is chosen (not just by role label) and the work item is **assigned**
(`work.service.ts` → `assign()`), which emits `work.assigned`. `POST /work-items/:id/route` exposes
this directly (`modules/routing/routing.controller.ts`).

---

## 5. What runs it? — the Omni Router, then execution

```
(prod) work.assigned → modules... EventBus → workers/execution.worker.ts (auto-chain)

workers/execution.worker.ts  (runOnce)
 1. picks the assigned work item
 2. OmniRouter.selectModel(item, employee)   → modules/routing/omni/dynamic-omni-router.service.ts
                                                (byTaskType → complexity tier → default; returns
                                                 { runtimeKey, provider, model })
 3. BudgetsService.check(employee)            → modules/budgets/budgets.service.ts (block if over)
 4. WorkspacePort.prepare()                   → modules/workspaces/local-worktree.workspace.ts
                                                (fresh git repo/worktree + branch per run)
 5. AgentRunsService.create()                 → modules/runtimes/agent-runs.service.ts (records the run)
 6. builds a RuntimeRunContext (governance gate attached) and drives the runtime:
      RuntimeRegistry.get(runtimeKey)         → modules/runtimes/runtime-registry.ts
        ├─ claude_code → modules/runtimes/claude-code/claude-code.runtime.ts (Agent SDK)
        └─ custom      → modules/runtimes/custom/custom.runtime.ts (native provider loop)
```

**The runtime emits a normalized `RuntimeEvent` stream** (`modules/runtimes/runtime.port.ts`), so
everything downstream is runtime-agnostic. The worker's `drive()` loop consumes those events and
enforces the **circuit breakers** (spec §21): max-duration (races each `next()`), max-tool-calls, and
hard-budget kill (on each `usage` event → `cost_events`).

### 5a. Governance & approvals (during the run)

```
Before each tool call the runtime calls ctx.canUseTool (built in execution.worker.ts):
 └─ modules/governance/governance.service.ts   → allow | deny | approval_required
      approval_required → modules/approvals/approvals.service.ts creates a pending approval,
      the runtime emits `needs_approval`, the run PAUSES.

Human decides:  POST /approvals/:id/decision   → modules/approvals/approvals.controller.ts
 └─ approved → workers/approval-decision.listener.ts → execution.worker.ts resumeRun() (by session id)
    denied   → run + work item marked failed.
```

Transcripts are written with secrets stripped by `modules/governance/redaction.ts`.

---

## 6. Was it any good? — Evaluation (never self-reported)

```
execution completes → work item status = 'evaluating'
 └─ (prod) work.status_changed → modules/evaluation/evaluation.worker.ts
      1. modules/evaluation/script-discovery.ts   → finds the repo's build/test/lint scripts
      2. modules/evaluation/command-runner.ts      → runs them
      3. modules/evaluation/evaluation-engine.ts   → scores each dimension, overall pass/fail
      4. modules/evaluation/evaluations.service.ts → stores the scored evaluation
      5. routes the work item → 'done' (pass) or 'rework' (fail)
```

---

## 7. Get better over time — Performance, Reputation, Skills

```
still inside evaluation.worker.ts, after routing:
 └─ modules/performance/performance.service.ts   → writes performance_records (measurements only)
 └─ modules/performance/skill-progression.service.ts → applies non-uniform skill growth
                                                       (modules/performance/skill-math.ts)

Read side (computed, nothing stored as a rank):
 GET /employees/:id/profile → modules/performance/profile.controller.ts
   ├─ modules/performance/reputation.service.ts      (reputation-math.ts: recency-weighted)
   └─ modules/performance/specialization.service.ts  (inferred from history)
```

This closes the learning loop (spec §15): the reputation/skill data these files compute becomes an
input to the Workforce Router (§4) for future work.

---

## 8. See it — Observability & UI

```
GET /companies/:id/overview   → modules/observability/observability.controller.ts
GET /work-items/:id/runs      → execution history
GET /agent-runs/:id           → single run detail
GET /ui                       → modules/observability/ui.controller.ts (the dashboard page)
```

---

## One-line mental model

`goal → heartbeat wakes CEO → CEO plans → Workforce Router (WHO) → Omni Router (WHAT) →
runtime executes in an isolated workspace under governance + circuit breakers → Evaluation scores it →
Performance/Reputation/Skills update → future routing uses that data.`

Folder-by-folder detail is in each directory's `README.md`.
