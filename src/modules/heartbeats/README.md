# `modules/heartbeats/` — waking the CEO + planning

The autonomous entry point: starting a goal wakes the CEO, who breaks it into work and delegates
(spec §11, §27 steps 4–6).

| File | What it does | Significance |
| --- | --- | --- |
| `heartbeats.schema.ts` | The `heartbeats` table (a scheduled/fired wake-up for an employee, tied to a goal). | Records the trigger; foundation for richer scheduling later. |
| `ceo-planner.service.ts` | Finds the CEO, runs it via its runtime as a **goal-level run** (writes `PLAN.json`), parses the plan, creates a project + work items, and **routes each via the Workforce Router**. Resilient: falls back to one default item if no plan. | Turns a human goal into assigned, routable work — the heart of autonomy. |
| `heartbeat.worker.ts` | `onGoalStarted()` — records a fired heartbeat and invokes the planner. Prod-subscribes to `goal.started`. | The trigger glue. |
| `heartbeats.controller.ts` | `POST /goals/:id/plan` — explicit trigger (also fired automatically). | Lets the UI/tools kick off planning. |
| `heartbeats.module.ts` | Wires everything; imports goals/employees/projects/work/runtimes/workspaces/routing. | — |

**Relationships:** the most "central" orchestrator besides the execution worker — it touches goals,
runtimes, workspaces, work, and routing to go from *goal started* to *work assigned*.
