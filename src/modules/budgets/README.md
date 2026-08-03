# `modules/budgets/` — cost tracking + budget circuit breaker

Every run reports cost; each employee has a budget. Enforced, not just tracked (spec §21).

| File | What it does | Significance |
| --- | --- | --- |
| `budgets.schema.ts` | Tables `budgets` (per-employee soft/hard limits, period) and `cost_events` (the granular cost ledger). | The ledger is the **source of truth** for spend. |
| `budget-evaluation.ts` | **Pure** `evaluateBudget(spend, soft, hard) → ok | soft_exceeded | hard_exceeded`. | The decision, unit-testable; hard beats soft. |
| `budgets.service.ts` | `setBudget`, `recordCost` (append to ledger), `spend` (sum over the period), `check` (state vs limits). | What the worker consults before/ during a run. |
| `budgets.controller.ts` | `PUT/GET /employees/:id/budget`. | Configure/read limits. |
| `budgets.module.ts` | Wires + exports `BudgetsService`. | — |
| `budget-evaluation.spec.ts` | Unit tests for block/kill thresholds. | Locks the enforcement rule. |

**Relationships:** `workers/execution.worker.ts` calls `check()` before a run (**soft → block new**)
and on each `usage` event (**hard → kill mid-run**), and appends `cost_events`.
