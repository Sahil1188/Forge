# `test/` — end-to-end tests

E2E specs that boot the whole Nest app against a **real PostgreSQL** and exercise the HTTP API +
workers. Run with `npm run test:e2e` (needs `npm run db:up` first). Unit tests live next to their
source as `*.spec.ts` and run with `npm test` (no DB).

These run **sequentially in a single fork** (shared DB + global work queue). Runtime behavior is
driven by **mock runtimes/providers** registered on the registry, so no live SDK/credentials are
needed — except the one guarded live test.

| File | What it verifies |
| --- | --- |
| `employees.e2e-spec.ts` | Company + employee CRUD; model policy persists; reporting line; 404s. |
| `work-graph.e2e-spec.ts` | goal→project→work creation; outbox events reach subscribers; status-machine enforcement over HTTP. |
| `execution.e2e-spec.ts` | The execution pipeline via a mock runtime: assigned item → run → workspace → `agent_run` recorded → item `evaluating`. |
| `approvals.e2e-spec.ts` | Governance pause → approve→resume→complete, and deny→halt; transcript redaction. |
| `circuit-breakers.e2e-spec.ts` | Hard-budget kill mid-run, max-duration kill, and budget block-before-run. |
| `evaluation.e2e-spec.ts` | Real `npm test` run → pass routes to `done`, fail routes to `rework`. |
| `performance.e2e-spec.ts` | Evaluation updates the computed profile: reputation, performance record, skill growth. |
| `memory.e2e-spec.ts` | The learning loop: an evaluation writes a durable memory that is then recalled into the next run's context. |
| `routing.e2e-spec.ts` | Workforce Router picks the best-fit employee; Omni Router picks the per-task model. |
| `heartbeat.e2e-spec.ts` | Goal start wakes the CEO, plans work, and routes it to the developer. |
| `vertical-slice.e2e-spec.ts` | **The full §27 story** end to end (company→CEO plan→route→execute→evaluate→profile→UI), all on the `claude_code` key via a mock. |
| `custom-runtime.e2e-spec.ts` | A worker on `CustomRuntime` executes via an Omni-Router-selected provider+model, with identical governance pause/resume. |
| `api-contract.e2e-spec.ts` | HTTP contract: validation (400), unknown ids (404), malformed ids never 500, the reporting line, **tenant isolation** (manager / assignee / dependency must be same-company), dependency cycles, budget validation. |
| `execution-lifecycle.e2e-spec.ts` | Failure paths (throwing/unregistered/failed runtimes), tool-call ceiling, cost accounting, queue order + **dependency ordering**, concurrency guard, workspace/artifacts/transcripts, the worker-wired governance gate (incl. workspace confinement), **approvals** (decide-once, bound to exact input, one-shot, no stuck runs), and the fail→rework→pass learning loop. |
| `planner.e2e-spec.ts` | CEO discovery, routing to the best-fit employee, tenant scoping, **malformed `PLAN.json` robustness**, planner failure handling, planning spend + budget gate, planner confinement. |
| `outbox-events.e2e-spec.ts` | Events per domain write, atomic with the write, exactly-once delivery, subscriber isolation, budget/approval events. |
| `sandbox-docker.e2e-spec.ts` | **Real containers** (skipped if no Docker daemon): no network/DNS, workspace-only mount, dropped caps, memory cap, `--rm`, no host-shell interpretation. |
| `project-workspace.e2e-spec.ts` | One shared repo per project: later items start from earlier merged work, failed work is never merged, retries continue the previous attempt, retry limit, merge conflicts, goal completion, planner ordering. |
| `server-autochain.e2e-spec.ts` | The `forge serve` chain driven only by events: start goal → plan → ordered runs → retry → merge → goal completed; replayed events do not re-plan. |
| `employee-management.e2e-spec.ts` | Edit employees (profile, manager with cycle checks, runtime, governance), replace skills, deactivate; changes take effect in routing and the runtime gate. |
| `short-tasks-acceptance.e2e-spec.ts` | Direct mode (no CEO run), the plan-size cap, acceptance checks from the goal/CEO/API, and "right code, wrong layout" failing then passing. |
| `cli.e2e-spec.ts` | `forge` exit codes and arg handling; `status` / `goal` boot the real compiled app (runs `npm run build` first). |
| `claude-code-live.e2e-spec.ts` | **Guarded** live Claude Agent SDK smoke test — runs only with `FORGE_LIVE=1` or `CLAUDE_CODE_OAUTH_TOKEN`. |
| `live-pipeline.e2e-spec.ts` | **Guarded LIVE** (`FORGE_LIVE=1`, uses your Claude Code login, Haiku): real CEO plans → real dev builds a library → real `npm test` evaluation → independent check of the code; real SDK approval pause/resume; real SDK tool denial. |

Shared helpers (app boot, scaffolding, a scripted runtime, queue hygiene) live in `helpers.ts`.
Every spec clears stray `assigned` work at boot — the execution queue is global.

## Running the live tests

```bash
FORGE_LIVE=1 npx vitest run --config vitest.e2e.config.ts test/claude-code-live.e2e-spec.ts test/live-pipeline.e2e-spec.ts
```

Billing: they use your Claude Code **subscription** session. `ANTHROPIC_API_KEY` must be unset (the
live spec asserts this, and the runtime strips it from the agent's environment regardless).
