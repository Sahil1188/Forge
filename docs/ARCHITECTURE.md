# Forge — V1 Architecture Proposal

> Scope: the §27 vertical slice only. Everything here is designed so the wider §1–§30 vision can be layered on **without rewriting the core**. Where the spec defers something ("V1: keep simple"), this doc defines the *seam* (interface) now and a trivial implementation behind it.

---

## 1. Repository state (§31.1)

The repo is empty apart from `.claude/settings.local.json` (one allowed Bash permission). This is a greenfield build. No existing code, no git history, no prior decisions to honor beyond the spec and the team stack convention (NestJS + TS + PostgreSQL, raw SQL / Drizzle over heavy TypeORM).

---

## 2. High-level shape of the V1 slice (§31.2)

A **modular monolith** (single NestJS process) plus **background workers** that run in the same process in V1 (separate deployables later). One PostgreSQL database. The Agent SDK drives Claude Code runs inside per-employee git worktrees.

```
┌──────────────────────────────────────────────────────────────┐
│  NestJS Monolith (one process, modular)                        │
│                                                                │
│  HTTP API ──► Domain modules (companies, employees, goals,     │
│               work, routing, runtimes, evaluation, ...)        │
│                     │                                          │
│                     ▼                                          │
│  Outbox (Postgres table) ──► In-process EventBus               │
│                     │                                          │
│         ┌───────────┼───────────────┐                          │
│         ▼           ▼               ▼                          │
│  HeartbeatWorker  ExecutionWorker  EvaluationWorker            │
│         │           │               │                          │
│         │           ▼               │                          │
│         │   ClaudeCodeRuntime ──► @anthropic-ai/claude-agent-sdk│
│         │           │               │                          │
│         │      git worktree         │  runs build/test/lint    │
│         │      per employee         ▼                          │
│         └──────► PostgreSQL ◄────────┘                          │
└──────────────────────────────────────────────────────────────┘
```

Workers are just injectable services driven by a polling loop over queue tables in V1. The queue abstraction is a thin interface so it can become BullMQ/Redis or pg-boss later without touching domain code.

---

## 3. Domain entities (§31.3)

Grouped by bounded context. Only the **bold** ones get tables in the first milestones; the rest are designed-for but deferred.

- **Organization:** `User`, **`Company`**, `Department`, `CompanyMember`
- **Workforce:** **`Employee`**, `EmployeeRelationship` (manager/report), **`EmployeeSkill`**, **`EmployeeRuntimeConfig`**, `EmployeeModelPolicy`
- **Work:** **`Goal`**, **`Project`**, **`WorkItem`**, `WorkDependency`, **`WorkAssignment`**
- **Execution:** **`AgentRun`**, `Heartbeat`, **`Workspace`**
- **Governance:** `ToolPermission`, **`Approval`**, `Budget`, **`CostEvent`**
- **Results:** **`Evaluation`**, **`PerformanceRecord`** (measurements, not ranks)
- **Platform:** **`Event`** (outbox), `AuditLog`, `Memory`

The design principle from §13/§14/§16: **store raw measurements, compute derived views (reputation, specialization, skill level) on read.** No mutable "reputation number" column.

---

## 4. Database schema — V1 (§31.4)

Drizzle-defined, PostgreSQL. UUID PKs (`gen_random_uuid()`), `created_at`/`updated_at` on every table, soft-delete (`deleted_at`) where records must persist for audit. Only tables needed for the slice are listed; §26 has the full future set.

```sql
-- Organization
users(id, email, name, created_at)
companies(id, owner_user_id → users, name, description, created_at, deleted_at)

-- Workforce
employees(
  id, company_id → companies, name, role, description,
  department, manager_employee_id → employees (nullable),  -- reporting line
  runtime_config_id → employee_runtime_configs,
  status,                    -- idle | working | paused_for_approval | error
  autonomy_json,             -- heartbeat policy, delegation perms, approval-required action types
  governance_json,           -- permissions (github r/w, db, deploy), allowed tools
  created_at, deleted_at
)
employee_skills(id, employee_id, skill_key, level_int, source)  -- seed levels; grow from performance
employee_runtime_configs(
  id, runtime_key,           -- 'claude_code' (only real one in V1)
  provider,                  -- 'anthropic'
  model_policy_json,         -- { default, byTaskType: { architecture: opus, coding: sonnet, ... } }
  settings_json,             -- temperature-equiv, max_turns, permission_mode
  created_at
)

-- Work graph
goals(id, company_id, title, description, status, created_by_user_id, created_at)
projects(id, goal_id, company_id, name, status, created_at)
work_items(
  id, project_id, company_id, title, description,
  task_type,                 -- 'architecture' | 'coding' | 'review' | ... (drives Omni Router)
  status,                    -- created | assigned | in_progress | needs_approval | evaluating | rework | done | failed
  priority_int, assigned_employee_id → employees (nullable),
  artifacts_json,            -- files changed, branch, output refs
  created_at, updated_at
)
work_dependencies(id, work_item_id, depends_on_work_item_id)  -- table exists; solver trivial in V1
work_assignments(id, work_item_id, employee_id, assigned_by, reason_json, created_at)

-- Execution
workspaces(id, employee_id, work_item_id, kind, root_path, git_branch, base_ref, status, created_at)
  -- kind = 'local_worktree' in V1
agent_runs(
  id, work_item_id, employee_id, workspace_id,
  runtime_key, provider, model,
  status,                    -- running | completed | failed | needs_approval | killed_budget | killed_timeout
  session_id,                -- Agent SDK session id (for resume, §9.6)
  started_at, ended_at, duration_ms,
  input_tokens, output_tokens, estimated_cost_usd,
  tool_call_count, files_changed_count,
  transcript_ref,            -- pointer to stored event stream (jsonl on disk / table)
  error_json, created_at
)
heartbeats(id, employee_id, scheduled_for, fired_at, status, created_at)

-- Governance
approvals(
  id, agent_run_id, work_item_id, employee_id,
  requested_action_json,     -- the intercepted tool call (tool name + args)
  status,                    -- pending | approved | denied
  decided_by_user_id, decided_at, created_at
)
cost_events(id, agent_run_id, employee_id, input_tokens, output_tokens, cost_usd, created_at)
budgets(id, employee_id, period, soft_limit_usd, hard_limit_usd, created_at)  -- V1: block on soft, kill on hard

-- Results
evaluations(
  id, work_item_id, agent_run_id, status, overall_score,
  detail_json,               -- { build, tests, lint, requirements, security, ... each with score+raw output }
  created_at
)
performance_records(
  id, employee_id, work_item_id, task_type,
  quality_score, correctness_score, reliability_score,
  tests_score, security_score, evaluation_score,
  cost_usd, duration_ms, human_approval_bool, retries_int,
  created_at
)

-- Platform
events(id, aggregate_type, aggregate_id, type, payload_json, published_at, created_at)  -- outbox
audit_logs(id, actor_type, actor_id, action, target_json, created_at)
```

**Why no `reputation` column:** §13 requires reputation to be *calculated* from `performance_records` (recency weighting, per-task-type) so we never migrate schema to change the formula. A `ReputationService` computes it on demand and can cache.

---

## 5. Module structure (§31.5)

Starts from §25, trimmed to what the slice needs. Each module exposes a **port interface**; cross-module calls go through ports, never through another module's internals — this is the seam that lets a module become a service later.

```
src/
  main.ts
  app.module.ts
  infrastructure/
    database/        # drizzle client, migrations, schema
    events/          # outbox writer + in-process EventBus + dispatcher
    queue/           # QueuePort (pg-table impl in V1)
    config/          # env, secrets loading
  modules/
    companies/       # Company + Department CRUD
    employees/       # Employee, skills, runtime configs, reporting lines
    goals/           # Goal CRUD + "start goal" command
    projects/
    work/            # WorkItem, dependencies, assignments, status machine
    routing/
      workforce/     # WorkforceRouterPort  -> V1: skill+role scoring
      omni/          # OmniRouterPort        -> V1: static model policy lookup
    runtimes/
      runtime.port.ts        # AgentRuntime interface
      claude-code/           # ClaudeCodeRuntime (Agent SDK)
      custom/                # CustomRuntime — INTERFACE STUB ONLY (§3.2)
    workspaces/      # WorkspacePort -> LocalWorktreeWorkspace
    evaluation/      # EvaluationEngine — discovers & runs repo scripts
    performance/     # PerformanceRecord writer
    reputation/      # ReputationService (read-model, computed)
    approvals/       # approval request/decide + resume signaling
    budgets/         # budget check + circuit breaker policy
    governance/      # permission model + hook policy builder
  workers/
    heartbeat.worker.ts
    execution.worker.ts
    evaluation.worker.ts
```

---

## 6. Claude Code integration (§31.6)

**Decision confirmed: Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`, TypeScript), not CLI-subprocess shelling.** Rationale exactly as §9.1: Forge needs structured events for observability (§23), evaluation triggers (§12), mid-run approval interception (§9.3/§20), and native session/resume (§9.6). Scraping `claude -p` stdout gives none of these cleanly. The SDK's `query()` yields a typed async stream of messages (assistant text, tool_use, tool_result, result-with-usage), accepts `hooks` and a `canUseTool` callback, and supports `resume: <sessionId>`.

**Subagent terminology collision resolved (§9.2):** A Forge *employee* is a DB record. When employee A delegates to employee B, Forge starts a **separate top-level `query()` run** for B in B's own workspace — a distinct `agent_runs` row, distinct session. Forge never uses Claude Code's native `Task`/subagent feature to represent employees. Claude Code's own subagents may run *inside* a single employee's session for that employee's internal splitting; Forge's orchestration neither knows nor cares. In code this is enforced structurally: only `ExecutionWorker` may start a runtime run, and it always does so per assigned `work_item` → one employee → one top-level session.

### 6.1 What `ClaudeCodeRuntime.run()` does (maps to §9.4)
1. Ask `WorkspacePort` for a prepared worktree (branch, base ref).
2. Build context: task text, a generated per-run `CLAUDE.md` (§9.5) from the employee's role/skills/memory, and the model chosen by the Omni Router.
3. Build `options` for `query()`: `cwd`, `model`, `permissionMode`, `allowedTools`, `hooks` (governance), `mcpServers` (Tool Gateway tools), `maxTurns` (circuit breaker), `resume` if resuming.
4. Provide a `PreToolUse` hook + `canUseTool` that consult the Governance/Approval/Budget services (see §7–§9 below).
5. Stream messages → persist each to the run transcript, update `agent_runs` counters live, emit `work.progress` events.
6. On `result` message: capture usage (`input_tokens`, `output_tokens`, `total_cost_usd`), files changed (git diff), final status.
7. Return a `RuntimeResult` to the ExecutionWorker, which hands artifacts to the Evaluation Engine.

Secrets are injected via env into the SDK process/tools only, never written to transcript or logs (redaction pass on persisted events).

---

## 7. Runtime abstraction (§31.7)

```ts
interface AgentRuntime {
  readonly key: string;                       // 'claude_code'
  run(ctx: RuntimeRunContext): AsyncIterable<RuntimeEvent>;  // streams events
  resume(sessionId: string, ctx): AsyncIterable<RuntimeEvent>;
}
```

`RuntimeRunContext` = { workspace, task, model, allowedTools, hookPolicy, limits }. `RuntimeEvent` is a normalized union (`assistant_text | tool_use | tool_result | needs_approval | usage | completed | failed`) so **nothing downstream is coupled to the SDK's message shape**. Observability, evaluation, and budget code consume `RuntimeEvent`, not SDK types.

**V1 scope confirmed:** `ClaudeCodeRuntime` fully implemented. `CustomRuntime` is the interface + a `throw new NotImplementedError()` stub so the abstraction is real but no arbitrary-local-model work is built (§3.2). A registry maps `runtime_key → AgentRuntime`; employees reference a key, so adding runtimes later is a registry entry, not a core change.

### 7.1 Org runtime split (CEO/leads vs workers)

Forge's target org model assigns runtimes by role:

- **CEO and any lead/manager employees are pinned permanently to `ClaudeCodeRuntime` + Claude models.** They plan, delegate, and review; they never move to arbitrary providers.
- **Worker employees (task executors) run on `CustomRuntime`, with the Omni Router selecting the model per task** — Claude Sonnet via API, a local LLM, or another provider.

**Sequencing:** the M0–M10 vertical slice keeps *everyone* on `ClaudeCodeRuntime` (CEO on Opus, developer on Sonnet), exactly as §27 intends — this proves the whole loop with the fully-native path. `CustomRuntime` stays a throwing stub until **M11**, which builds it out for real alongside a working Omni Router policy and flips worker employees onto it. `employees.runtime_config_id` already carries the runtime key per employee, so this flip is data, not a core rewrite.

**Billing constraint (hard rule):** `ClaudeCodeRuntime` runs on the user's **Claude Code subscription auth** — local OAuth session, or `CLAUDE_CODE_OAUTH_TOKEN` in CI. **`ANTHROPIC_API_KEY` is never set anywhere for the Claude Code path**, because it overrides subscription billing and forces per-token charges instead of using the plan's included usage. Only M11 `CustomRuntime` workers that call a raw model API use their own per-token API credentials — an inherently per-token path, kept strictly separate from the subscription-billed Claude Code runtime.

---

## 8. Where the two routers plug in (§31.8)

They are separate ports called at different points in the pipeline:

```
Goal started → CEO run produces work_items
   → for each work_item:
        WorkforceRouterPort.selectEmployee(workItem, candidates) → employee   (WHO)
        → WorkAssignment created
   → ExecutionWorker picks up assignment:
        OmniRouterPort.selectModel(workItem, employee) → { runtime, provider, model }   (WHAT)
        → ClaudeCodeRuntime.run(...)
```

- **WorkforceRouter V1:** pluggable scoring engine interface; the V1 implementation scores candidates by `role/department match + employee_skills level + availability(status)`. History weighting (via `ReputationService`) is wired as an input but weighted 0 until there's data — flipping it on later is a config change, not a rewrite (§7 of spec).
- **OmniRouter V1:** reads `employee_runtime_configs.model_policy_json` — a static `taskType → model` map (architecture→Opus, coding→Sonnet, boilerplate→Haiku). No dynamic algorithm (§8 "trivial static impl"). For `claude_code` employees this is purely "which Claude model."

Both are interfaces with trivial bodies now; both consume data (skills, performance, cost) that later implementations will weigh without changing callers.

---

## 9. Performance/Reputation extensibility (§31.9)

- Execution and evaluation **only write raw `performance_records`** (per §13). They never compute a rank.
- `ReputationService` and a `SpecializationService` are **pure read-models** over `performance_records`: reputation = recency-weighted, task-type-aware aggregate; specialization = clustering of high-score task_types (§16). Because nothing is precomputed/stored, changing the formula is a code change to one service, zero migrations.
- Skill growth (§14) is a `SkillProgressionService` that reads an evaluation's score **and** the work item's complexity, and applies a configurable, non-uniform delta (trivial task → tiny/zero; hard high-score task → meaningful; repeated failure → decrement). The policy is a strategy object, swappable.
- Promotions (§17) later read the same records against thresholds and adjust `governance_json`/role — hooking into routing because the router already reads skills/role/reputation.

---

## 10. Tool Gateway & approval flow via native hooks (§31.10)

Built **on** Claude Code's hooks, not beside them (§9.3/§19/§20).

- **Tool allow-listing:** `governance_json` → `allowedTools` passed to `query()`. Disallowed tools never run.
- **Per-call policy:** a `PreToolUse` hook (and/or `canUseTool`) consults `GovernanceService`:
  - `allow` → return continue.
  - `deny` → return a block decision with reason (agent sees it, adapts).
  - `approval_required` → the hook **creates a pending `approvals` row**, sets `agent_run.status = needs_approval` + `work_item.status = needs_approval`, emits `approval.requested`, and **blocks the tool call** (hook returns a deny/ask that halts that action).
- **Resume:** human approves/denies in UI → `ApprovalsService.decide()` → emits `approval.approved` → ExecutionWorker resumes the run via `runtime.resume(sessionId)` (§9.6), and the previously-gated action proceeds. If the SDK's in-band `canUseTool` promise can stay pending for the approval window, we await it directly; otherwise we stop the run and resume by session id. Both paths are supported behind the `AgentRuntime` interface so the choice is an implementation detail settled during Milestone 4.
- External integrations (GitHub/Slack/etc.) are later exposed as **MCP tools** through the same hook-governed path, so one governance model covers native and external tools.

---

## 11. Concurrency & workspace isolation (§31.11)

Treated as a V1 concern (spec §10 insists). **One git worktree per employee-run**, off a shared bare clone of the target repo:

```
workspaces/<company>/<repo>.git            # bare clone (shared base)
workspaces/<company>/runs/<agentRunId>/    # git worktree, branch forge/<employee>/<workItem>
```

- Each `ClaudeCodeRuntime.run` gets an isolated working tree + its own branch → no file collisions between parallel employees.
- Integration strategy: each completed+passed work item's branch is merged (fast-forward or PR-style merge) by an integration step; conflicts surface as a follow-up work item rather than corrupting anyone's tree.
- `WorkspacePort` abstracts this so `DockerWorkspace`/`K8sWorkspace` (§10) drop in later. V1 = `LocalWorktreeWorkspace`. Worktrees are cleaned up (or archived for audit) on run completion.

---

## 12. Budget & circuit breakers (§31.12)

Three independent, platform-enforced backstops (§21) — none rely on the model's judgment:

1. **Cost budget:** every `RuntimeEvent(usage)` writes a `cost_events` row and increments the run's cost. Before each new run and on each usage tick, `BudgetService` checks the employee's period spend:
   - **soft limit hit → block *new* runs + alert** (V1 default per §21).
   - **hard limit hit → kill the in-flight run** (`status = killed_budget`), emit `budget.exceeded`.
2. **Max duration:** ExecutionWorker sets a timer; on expiry it aborts the SDK query → `killed_timeout`.
3. **Max tool calls:** `maxTurns`/counter in the runtime; exceeding it aborts the run.

All three are enforced in `ClaudeCodeRuntime`/`ExecutionWorker`, outside the agent's control.

---

## 13. Security concerns specific to autonomous code execution (§31.13)

Agents are **untrusted processes** (§24). Concrete V1 measures and known gaps:

- **Workspace confinement:** runs are scoped to their worktree `cwd`. *Gap:* local process isolation is not a true sandbox — a malicious/hallucinated `rm -rf` or path traversal outside `cwd` is possible. Mitigations for V1: run with least-privilege OS user where feasible, deny destructive Bash patterns via `PreToolUse` hook, and roadmap `DockerWorkspace` as the real isolation boundary (interface already present, §11).
- **Secret handling:** secrets injected via env into the runtime/tool process only; **redaction pass** on every persisted transcript/event and log so tokens never land in `agent_runs.transcript_ref` or audit logs (§19/§24).
- **Tool authorization:** default-deny; only `allowedTools` + hook-approved actions run (§10). Production DB / deploy tools are `approval_required` or absent.
- **Network:** V1 documents the risk (agent can hit arbitrary URLs); egress restriction is a `DockerWorkspace`/network-policy concern flagged for the isolation milestone.
- **Prompt injection:** repo contents and tool outputs can carry injected instructions; governance is enforced by hooks/allow-lists at the *tool boundary*, not by trusting the model to refuse — this is the correct defense posture.
- **Audit:** every tool call, approval decision, and budget kill is an `audit_logs` + `events` row.

Security is structural (hooks, allow-lists, worktree scoping, redaction) from milestone 1, with container isolation as the explicit next hardening boundary — not deferred to "later."

---

## 14. Key decisions locked for V1

| Question | Decision |
|---|---|
| Drive Claude Code via | Claude **Agent SDK** (TS), not CLI stdout (§9.1) |
| Employee vs CC subagent | Employee = separate top-level SDK run; never a CC native subagent (§9.2) |
| Runtimes in V1 | `ClaudeCodeRuntime` full; `CustomRuntime` interface stub only until M11 (§3.2/§7.1) |
| Org runtime split | CEO/leads pinned to Claude Code+Claude permanently; workers → CustomRuntime+Omni Router at M11. Slice M0–M10 uses Claude Code for all (§7.1) |
| Claude Code auth | Subscription OAuth / `CLAUDE_CODE_OAUTH_TOKEN`. **Never** `ANTHROPIC_API_KEY` (would force per-token billing) (§7.1) |
| Model routing | Static `taskType→model` policy (Opus/Sonnet/Haiku) (§8) |
| Workforce routing | Skill+role+availability scoring; history wired but weight 0 (§7) |
| Reputation storage | Computed read-model over `performance_records`; no stored rank (§13) |
| Governance | Built on native hooks (`PreToolUse`/`canUseTool`), default-deny (§9.3/§19) |
| Approval pause/resume | Hook creates `approvals` row + blocks; resume via `session_id` (§20/§9.6) |
| Isolation | git worktree + branch per run; `WorkspacePort` for Docker/K8s later (§10) |
| Budget enforcement | soft=block new+alert, hard=kill run; +duration & tool-call caps (§21) |
| Events | Postgres outbox + in-process bus; no Kafka (§22) |
| Persistence | PostgreSQL + Drizzle (raw SQL where perf matters) (§25) |
