# `modules/goals/` — what you ask the company to build

A goal is a person's objective in plain words, for example "a reconciliation app for a small finance
team". Starting a goal is what sets the company to work.

## How it works

- **Two modes:**
  - `plan` (default): the planning executive breaks the goal into a project and ordered, parallel work
    items, each with an owner and acceptance checks (see `heartbeats`).
  - `direct`: no planning; one work item goes straight to the best-fit employee. For small, clear
    requests.
- **Status:** `draft → active → completed` (or `cancelled`). A goal completes when every step of its
  projects is done; cancelled steps don't block it.
- **Brand:** the goal can name the brand its UI follows; otherwise the company default or the
  planner's choice is recorded on it (`setBrand`).
- Creating and starting a goal record their events in the same transaction as the change.

## HTTP API

| Method | Path | Role | What it does |
| --- | --- | --- | --- |
| POST | `/companies/:companyId/goals` | member | Creates a goal (`{ title, description?, mode?, brand? }`). |
| GET | `/companies/:companyId/goals` | viewer | The company's goals. |
| GET | `/goals/:id` | viewer | One goal. |
| POST | `/goals/:id/start` | member | Starts it: planning (or the direct item) begins. |

## Events

Publishes `goal.created` and `goal.started`.

## Files

| File | Purpose |
| --- | --- |
| `goals.schema.ts` | The `goals` table (mode, status, brand). |
| `goals.service.ts` | Create, start, find, record the brand. |
| `goals.controller.ts` | The endpoints above. |
| `dto/create-goal.dto.ts` | Request validation. |
| `goals.module.ts` | Wiring; exports `GoalsService`. |

## Tests

`test/heartbeat.e2e-spec.ts`, `test/planner.e2e-spec.ts`, `test/vertical-slice.e2e-spec.ts`.

## Related

`heartbeats` (starts planning on `goal.started`), `projects`, `evaluation` (marks the goal completed),
`brands`.
