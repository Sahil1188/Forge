# `modules/routing/` — the two routers

Two **separate** decisions (spec §7/§8):
- **Workforce Router** — *WHO* should do this work?
- **Omni Router** — *WHAT* runtime/model should execute it?

| File | What it does | Significance |
| --- | --- | --- |
| `routing.controller.ts` | `POST /work-items/:id/route` — runs the Workforce Router and assigns the winner. | Auto-assignment entry point. |
| `routing.module.ts` | Binds `WORKFORCE_ROUTER → ScoringWorkforceRouter` and `OMNI_ROUTER → DynamicOmniRouter`; exports both tokens. | The seam: swap either router implementation without touching callers. |
| `routing.spec.ts` | Unit tests for candidate scoring + model selection. | Locks both routing behaviors deterministically. |
| `workforce/` | The WHO router. See its README. | — |
| `omni/` | The WHAT router. See its README. | — |

**Relationships:** `WORKFORCE_ROUTER` is used by `heartbeats` (CEO plan) and the controller;
`OMNI_ROUTER` is used by `workers/execution.worker.ts` and the CEO planner.
