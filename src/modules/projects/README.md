# `modules/projects/` — projects

A goal is broken into projects; a project groups related work items. Created by the CEO planner (or
manually).

| File | What it does | Significance |
| --- | --- | --- |
| `projects.schema.ts` | The `projects` table (belongs to a goal + company). | Middle layer of the work graph. |
| `projects.service.ts` | Create under a goal (emits `project.created`), list by goal, find. | Used by the CEO planner to place generated work items. |
| `projects.controller.ts` | `POST /goals/:goalId/projects`, `GET`. | CRUD surface. |
| `projects.module.ts` | Wires + exports `ProjectsService`. | Used by work + heartbeats. |
| `dto/` | Validation (see its README). | — |

**Relationships:** depends on `goals`; consumed by `work`, `heartbeats`.
