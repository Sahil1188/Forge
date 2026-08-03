# `modules/observability/` — read-side views + dashboard UI

The console layer (spec §23): human-readable views over runs/employees, plus a minimal web dashboard.

| File | What it does | Significance |
| --- | --- | --- |
| `observability.service.ts` | Builds the company overview (each employee's status, model, latest run) and run/history summaries. | Aggregates data for the UI without exposing raw internals. |
| `observability.controller.ts` | `GET /companies/:id/overview`, `GET /work-items/:id/runs`, `GET /agent-runs/:id`. | The read API the dashboard calls. |
| `ui.controller.ts` | Serves `GET /ui` — a dependency-free HTML/JS dashboard: employee status cards + per-employee profile. | The human-facing console; open `http://localhost:3000/ui`. |
| `observability.module.ts` | Wires the above; imports companies/employees/runtimes. | — |

**Relationships:** read-only; consumes `companies`, `employees`, `runtimes` (agent runs) and the
`performance` profile endpoint from the browser.
