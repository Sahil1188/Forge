# Forge — V1 Implementation Plan

Each milestone is **independently runnable and testable**. Every milestone ends with a green `pnpm test` + `pnpm build` and a manual smoke command. No milestone leaves the repo in a broken state. Culminates in the §27 vertical slice.

Stack: NestJS + TypeScript, PostgreSQL + Drizzle, `@anthropic-ai/claude-agent-sdk`, **npm** (pnpm unavailable in the build environment — sandbox blocks corepack; no functional difference), Vitest, Docker Compose for local Postgres. Script invocations below written as `npm run <script>` / `npm test`.

---

## M0 — Project skeleton & CI loop
**Goal:** a running NestJS monolith with DB connectivity and the test/build loop.
- Init git, pnpm workspace, NestJS app, TS strict config, ESLint/Prettier.
- Docker Compose Postgres; Drizzle configured; migration runner; `/health` endpoint hitting DB.
- Vitest wired; one trivial passing test; `pnpm build` green.
**Testable:** `docker compose up -d && pnpm migrate && pnpm start` → `GET /health` returns DB-OK. `pnpm test` green.

## M1 — Organization & workforce CRUD
**Goal:** create companies and employees with runtime config.
- Modules: `companies`, `employees` (+ `employee_skills`, `employee_runtime_configs`, reporting line).
- Migrations for those tables; REST endpoints; DTO validation.
- Seed script: one company, a CEO (claude_code/Opus policy), a Developer (claude_code/Sonnet policy).
**Testable:** e2e test creates company + 2 employees; `model_policy_json` persisted. 

## M2 — Work graph & event outbox
**Goal:** goals→projects→work_items with status machine, plus eventing.
- Modules: `goals`, `projects`, `work` (+ `work_dependencies`, `work_assignments`).
- `events` outbox table + in-process `EventBus` + dispatcher; emit `goal.created`, `work.created/assigned`.
- Work-item status state machine (created→…→done/failed) with guarded transitions.
**Testable:** unit tests for status transitions; creating a goal emits an event consumed by a test subscriber.

## M3 — Runtime abstraction + ClaudeCodeRuntime (dry, no governance yet)
**Goal:** execute a real Claude Code run via the Agent SDK in an isolated worktree.
- `AgentRuntime` port + `RuntimeEvent` normalization; `CustomRuntime` stub (throws).
- `WorkspacePort` + `LocalWorktreeWorkspace` (bare clone + worktree + branch).
- `ClaudeCodeRuntime.run()`: builds `CLAUDE.md`, calls `query()`, streams+normalizes events, records `agent_runs` (usage, tool count, files changed, session_id).
- `ExecutionWorker` (polling) picks an assigned work item and runs it.
**Testable:** integration test (guarded by **Claude Code subscription auth** — local OAuth session or `CLAUDE_CODE_OAUTH_TOKEN`; **never `ANTHROPIC_API_KEY`**, which would force per-token billing) runs a tiny task ("create hello.txt") in a worktree; asserts file created, `agent_runs` row populated with cost/session. Mock-SDK unit test for event normalization runs without any auth, so CI stays green.

## M4 — Governance, Tool Gateway & approval pause/resume
**Goal:** hook-based permission enforcement and human-in-the-loop.
- `governance` module: allowed-tools + `PreToolUse`/`canUseTool` policy builder.
- `approvals` module: hook creates pending `approvals`, sets `needs_approval`, blocks; `decide()` → resume via `runtime.resume(sessionId)`.
- Redaction pass on persisted transcripts/logs.
**Testable:** e2e — a task that triggers an approval-required tool pauses (run status `needs_approval`, approval row pending); approving resumes and completes; denying halts. Secret never appears in stored transcript.

## M5 — Budget & circuit breakers
**Goal:** platform-enforced cost/duration/tool-call limits.
- `budgets` module; `cost_events` on every usage tick; soft=block-new+alert, hard=kill-run.
- Duration timer + `maxTurns` cap in ExecutionWorker/runtime.
**Testable:** unit tests with injected usage exceeding soft/hard limits assert block vs kill; timeout test aborts a stalled run → `killed_timeout`.

## M6 — Evaluation Engine
**Goal:** objective verification of produced work.
- `evaluation` module + `EvaluationWorker`: discover repo scripts (`package.json` scripts / detected toolchain), run build/test/lint, capture raw output, produce `evaluations` row with per-dimension + overall score.
- Trigger on `work.result` from ExecutionWorker; set work item `done`/`rework` by threshold.
**Testable:** eval against a fixture repo with passing and failing test variants yields correct scores and pass/fail routing.

## M7 — Performance & Reputation read-model
**Goal:** measurements in, computed capability out.
- `performance` writes `performance_records` from each evaluation (no ranks).
- `ReputationService` + `SpecializationService` (computed read-models); `SkillProgressionService` (non-uniform, complexity-weighted deltas).
- Endpoint: employee profile shows computed reputation, specialization, updated skills.
**Testable:** feeding synthetic evaluation histories yields expected recency-weighted reputation and non-uniform skill growth (trivial task ≈ 0, hard high-score task > 0, failures decrement).

## M8 — Routers wired into the pipeline
**Goal:** WHO then WHAT selection in the real flow.
- `WorkforceRouterPort` V1 impl (skill+role+availability; reputation input weight 0).
- `OmniRouterPort` V1 impl (static `model_policy_json` lookup).
- Wire: work_item → WorkforceRouter → assignment → ExecutionWorker → OmniRouter → runtime.
**Testable:** given candidates, router selects expected employee and model per task_type; deterministic unit tests.

## M9 — Heartbeat + CEO planning step
**Goal:** the autonomous entry point of the slice.
- `HeartbeatWorker`: on goal start, schedules CEO heartbeat; CEO run produces ≥1 work item.
- Wire CEO output → work items → M8 routing → developer execution.
**Testable:** starting a goal fires CEO heartbeat, creates a work item, assigns the developer. (Uses M3 runtime; SDK-guarded.)

## M10 — V1 Vertical Slice end-to-end (§27) + minimal UI
**Goal:** the whole §27 story working and visible. **Everyone on `ClaudeCodeRuntime`** (CEO Opus, developer Sonnet) — the fully-native path, as §27 intends.
- **Demo task target:** the developer employee scaffolds a **small Node/Express app with a test** into the isolated worktree (chosen over a static site to exercise build+test+lint evaluation fully).
- Thin UI (or REST + a simple React page): create company → CEO(Opus) → goal "Build me a website" → start → CEO makes work item → developer(Sonnet) executes in isolated workspace → Node/Express app + test created & buildable → run captured (files/logs/tool calls/cost) → evaluation runs real `npm run build`/`test`/`lint` → performance update → UI shows execution history + updated employee profile.
- End-to-end e2e test asserting each of the 12 §27 steps.
**Testable:** one scripted e2e run reproduces §27 steps 1–12 (auth via subscription OAuth / `CLAUDE_CODE_OAUTH_TOKEN`); UI renders the live status card (§23) and the updated profile (§14).

## M11 — CustomRuntime + working Omni Router (worker execution off Claude Code)
**Goal:** make the org runtime split real (ARCHITECTURE §7.1). CEO/leads stay pinned to `ClaudeCodeRuntime`+Claude; **worker employees move to `CustomRuntime`** with the Omni Router picking the model per task.
- Build out `CustomRuntime` for real (replaces the throwing stub): a native agent loop that calls a model provider's API directly, emits the same normalized `RuntimeEvent` stream, and honors the same hook/governance/budget backstops as `ClaudeCodeRuntime`.
- Providers: start with Claude Sonnet **via API** (own per-token API credentials — inherently per-token, **separate** from subscription-billed Claude Code; documented, not silently mixed). Structure so a local LLM (Ollama/vLLM) or another provider drops in behind the same provider interface.
- Real `OmniRouterPort` implementation: per-task `taskType → {provider, model}` selection weighing complexity/cost/quality (replaces M8's static lookup for CustomRuntime employees).
- Flip worker employees' `runtime_config_id` to `custom` + an Omni Router policy; keep CEO/leads on `claude_code`.
**Testable:** a worker employee executes a task through `CustomRuntime`; Omni Router selects the expected model per task_type; governance/budget/approval backstops fire identically to the Claude Code path; CEO still runs on Claude Code. Live provider tests env-guarded on the provider's own credential (distinct from Claude Code auth).

## M12 — Memory, sandbox, and the operator CLI
**Goal:** close the three gaps that make Forge operable and safer to run: long‑term learning, a real security boundary for worker commands, and one‑command operation.
- **Agent memory (`modules/memory`)**: an `agent_memories` store + `MemoryService` (`remember`/`recall`/`recallBlock`). The evaluation worker writes an objective lesson after each run (failures high‑salience); the execution worker recalls the top memories into the run's `CLAUDE.md`. Deterministic ranking (salience + task‑type + recency) — a vector store can replace it behind the same interface.
- **Docker command sandbox (`runtimes/custom/command-sandbox.ts`)**: a `CommandSandbox` seam; `FORGE_SANDBOX=docker` runs a worker's `run_command` in an ephemeral `docker run --rm --network none` container (capped memory/CPU/pids, `--cap-drop ALL`, workspace‑only mount). Host remains the dev default.
- **CLI (`bin/forge`)**: `up`/`seed`/`serve`/`status`/`goal`. `goal` drives the full loop live in‑process, gated by `FORGE_MANUAL_DRIVE` (the same off‑switch the test runner uses) so it steps deterministically. Boots the compiled `dist/` app (tsc emits the DI metadata tsx/esbuild does not).
**Testable:** unit — memory ranking + sandbox selection/execution; e2e — an evaluation writes a memory that is recalled into the next run's context. CLI `status` boots the real container and lists the org; `goal` runs the live pipeline (needs Claude Code auth).

---

### Cross-cutting throughout
- Every milestone: migrations are forward-only + tested; `pnpm build` + `pnpm test` green; a `docs/` note on new seams.
- Ports before implementations; trivial impls behind real interfaces (routers, reputation, workspace, runtime registry) so later sophistication needs no caller changes.
- No Kafka, no K8s, no microservices, no custom LLM, no CLI-scraping — per §28.

### Suggested build order dependency
M0 → M1 → M2 → M3 → (M4, M5 parallelizable) → M6 → M7 → M8 → M9 → M10 → M11 → M12.
