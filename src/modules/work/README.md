# `modules/work/` — the steps of a project

Work items are the unit of execution. Each belongs to a project, has a domain (task type), an owner,
acceptance checks, and can depend on other items. A guarded status lifecycle keeps the flow
consistent.

## How it works

- **Lifecycle** (`work-status.ts`, enforced on every change):

  | From | Allowed next |
  | --- | --- |
  | `created` | `assigned`, `cancelled`, `failed` |
  | `assigned` | `in_progress`, `created`, `cancelled`, `failed` |
  | `in_progress` | `needs_approval`, `evaluating`, `failed`, `cancelled`, `assigned` (stopped by a usage limit) |
  | `needs_approval` | `in_progress`, `failed`, `cancelled` |
  | `evaluating` | `done`, `rework`, `failed` |
  | `rework` | `assigned`, `in_progress`, `cancelled`, `failed` |
  | `failed` | `assigned` (retry) |
  | `done`, `cancelled` | — |

- **Domains** (`domains.ts`): one table drives task types, which department owns them, the skills and
  roles that fit, and the keywords used to classify a plain-language request (`classify.ts`).
- **Standards** (`standards.ts`): the production bar each kind of specialist is held to, added to the
  task in their prompt.
- **Dependencies** form a graph; cycles are refused. A step starts only when everything it depends on
  is done.
- **Acceptance checks** are shell commands that must exit 0 for the step to pass (see `evaluation`).
- **Reassign** moves a waiting step to a teammate (used for parallel staffing).
- Every change records an event in the same transaction.

## HTTP API

| Method | Path | Role | What it does |
| --- | --- | --- | --- |
| POST | `/projects/:projectId/work-items` | member | Creates a step (`{ title, description?, taskType?, priority?, acceptance? }`). |
| GET | `/projects/:projectId/work-items` | viewer | A project's steps. |
| GET | `/work-items/:id` | viewer | One step. |
| POST | `/work-items/:id/assign` | admin | Assigns it to an employee. |
| POST | `/work-items/:id/status` | member | Moves it along the lifecycle (validated). |
| POST | `/work-items/:id/dependencies` | admin | Adds a dependency (`{ dependsOnWorkItemId }`); cycles refused. |

## Events

Publishes `work.created`, `work.assigned`, `work.status_changed`.

## Files

| File | Purpose |
| --- | --- |
| `work.schema.ts` | `work_items`, `work_dependencies`, `work_assignments`. |
| `work.service.ts` | Create, assign, reassign, change status, dependencies (with cycle check), find. |
| `work-status.ts` | The lifecycle table and transition check. |
| `domains.ts` / `classify.ts` | Domains and request classification. |
| `standards.ts` | Production standards per specialist. |
| `work.controller.ts` | The endpoints above. |
| `dto/work.dto.ts` | Request validation. |
| `work.module.ts` | Wiring; exports `WorkService`. |

## Tests

`work-status.spec.ts`, `work-status.matrix.spec.ts`, `domains.spec.ts`, `classify.spec.ts` (unit);
`test/work-graph.e2e-spec.ts`, `test/short-tasks-acceptance.e2e-spec.ts`.

## Related

Written by `heartbeats` (plans), `routing` (assignment), `workers` (running), `evaluation` (done or
rework) and `console` (changes, retries).
