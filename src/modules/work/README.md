# `modules/work/` — the work graph

Work items are the unit of execution. Not a flat list: items belong to projects, can depend on other
items, and move through a guarded status lifecycle (spec §6).

| File | What it does | Significance |
| --- | --- | --- |
| `work.schema.ts` | Tables `work_items` (title, `taskType`, `status`, `priority`, `assignedEmployeeId`, `artifacts`), `work_dependencies` (unique edges), `work_assignments`. Defines `TaskType`. | `taskType` drives the Omni Router; `artifacts` records the branch/files a run produced. |
| `work-status.ts` | **Pure** state machine: the allowed transition table (`created→assigned→in_progress→evaluating→done`, plus `needs_approval` pause and `rework` loop) + `assertTransition`. | Guarantees the lifecycle can't be corrupted; unit-tested independent of the DB. |
| `work.service.ts` | Create item, `assign()`, `changeStatus()` (validates via the state machine), add dependency, find. Each write emits an outbox event. | The single writer of work-item state; used by routing, workers, evaluation, heartbeats. |
| `work.controller.ts` | `POST /projects/:id/work-items`, `GET`, `POST /work-items/:id/{assign,status,dependencies}`. | CRUD + lifecycle surface. |
| `work.module.ts` | Wires + exports `WorkService`. | Widely depended on. |
| `work-status.spec.ts` | Unit tests for legal/illegal transitions. | Locks the lifecycle contract. |
| `dto/` | Validation (see its README). | — |

**Relationships:** the hub of the pipeline — written by `routing`, `heartbeats`, `workers`,
`evaluation`; its status changes drive the whole flow.
