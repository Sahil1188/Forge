# `modules/budgets/` — spending limits per employee

Every run reports its cost, and each employee can have a budget. Limits are enforced by the platform,
not left to the model.

## How it works

- A budget has a **soft** and a **hard** limit in USD, per day or for all time.
- Over the soft limit, new runs for that employee wait. At the hard limit, a running run is stopped.
  The hard limit wins when both apply.
- Spend is the sum of the cost ledger over the period. Every usage report from a run appends to it.
- No budget set means no limit.

Runs on the Claude subscription report estimated cost; it is shown for comparison and drives limits
the same way.

## HTTP API

| Method | Path | Role | What it does |
| --- | --- | --- | --- |
| GET | `/employees/:employeeId/budget` | viewer | Limits, period and current spend. |
| PUT | `/employees/:employeeId/budget` | admin | `{ softLimitUsd?, hardLimitUsd?, period? }`. |

## Files

| File | Purpose |
| --- | --- |
| `budgets.schema.ts` | `budgets` (limits per employee) and `cost_events` (the ledger). |
| `budget-evaluation.ts` | Pure decision: ok, soft exceeded or hard exceeded. |
| `budgets.service.ts` | Set limits, record cost, sum spend, check. |
| `budgets.controller.ts` | The endpoints above. |
| `dto/set-budget.dto.ts` | Request validation. |
| `budgets.module.ts` | Wiring; exports `BudgetsService`. |

## Tests

`budget-evaluation.spec.ts` (unit); `test/circuit-breakers.e2e-spec.ts` (block before a run, stop
during one).

## Related

`workers` (checks before and during each run), `heartbeats` (checks the planner's budget), `console`
(the Budget tab).
