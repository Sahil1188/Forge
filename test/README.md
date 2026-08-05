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
| `claude-code-live.e2e-spec.ts` | **Guarded** live Claude Agent SDK smoke test — skipped unless `CLAUDE_CODE_OAUTH_TOKEN` is set. |
