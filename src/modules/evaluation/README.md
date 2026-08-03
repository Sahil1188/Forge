# `modules/evaluation/` — objective verification (never self-report)

Completed work is verified by running the repo's real build/test/lint — the agent never certifies its
own work (spec §12). This is a core differentiator vs Paperclip.

| File | What it does | Significance |
| --- | --- | --- |
| `evaluation.schema.ts` | The `evaluations` table (status, overall score, per-dimension detail). | Stores the objective result routing + performance use. |
| `script-discovery.ts` | Reads `package.json` scripts to find `build`/`test`/`lint`. | Discovers the toolchain instead of assuming one; extensible to Maven/Cargo/etc. |
| `command-runner.ts` | Runs a discovered command in the workspace, capturing exit code + output. | The execution of the checks. |
| `evaluation-engine.ts` | **Pure** scoring: each present dimension 100/0, overall = mean, passes only if all pass; `inconclusive` if no toolchain. Redacts output. | The verdict; unit-tested against real fixture repos. |
| `evaluations.service.ts` | Persists an `EvaluationResult`, queries by work item. | DB wrapper. |
| `evaluation.worker.ts` | Orchestrates: resolve the run's workspace → run the engine → store → route the item to `done`/`rework` → **record performance + apply skill growth**. Prod-triggered on `work.status_changed → evaluating`. | The bridge from execution to learning. |
| `evaluation.controller.ts` | `GET /work-items/:id/evaluations`, `GET /evaluations/:id`. | Read surface. |
| `evaluation.module.ts` | Wires everything; imports work/runtimes/performance. | — |
| `evaluation-engine.spec.ts` | Unit tests scoring real pass/fail fixture repos. | Proves correct verdicts. |

**Relationships:** consumes `workspaces`/`agent-runs` to find the code, writes to `work`
(status) and `performance` (records + skills).
