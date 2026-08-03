# `modules/goals/` — goals

A goal is the human's objective ("Build me a website"). Starting a goal is what kicks off autonomy.

| File | What it does | Significance |
| --- | --- | --- |
| `goals.schema.ts` | The `goals` table (`status`: draft/active/completed/cancelled). | Top of the work graph. |
| `goals.service.ts` | Create (emits `goal.created`), `start()` (→ active, emits `goal.started`), find. Writes + outbox event in one transaction. | `goal.started` is the trigger the heartbeat worker listens for. |
| `goals.controller.ts` | `POST /companies/:id/goals`, `GET`, `POST /goals/:id/start`. | Where a human launches work. |
| `goals.module.ts` | Wires + exports `GoalsService`. | Used by projects, heartbeats. |
| `dto/` | Validation (see its README). | — |

**Relationships:** consumed by `projects`, `heartbeats` (planning), `routing`.
