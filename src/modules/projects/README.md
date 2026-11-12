# `modules/projects/` — where a goal's deliverable lives

A goal is delivered as one or more projects. Each project is a git repository on disk: its `main`
branch is the deliverable, and every step works on its own branch that is merged into `main` once it
passes its checks.

## How it works

- Projects are created by the planner (or by hand) under a goal.
- **Location:** `<root>/<company>/<project>-<id8>`, where the root is `FORGE_PROJECTS_DIR`, else
  `~/Forge Projects`. The absolute path is stored on the project, so moving the root later doesn't
  break existing projects. (Older projects without a stored path live under `workspaces/projects/`.)
- The repository is created on first use, with a `.gitignore` that keeps dependencies and build output
  out of the history.

## HTTP API

| Method | Path | Role | What it does |
| --- | --- | --- | --- |
| POST | `/goals/:goalId/projects` | member | Creates a project under a goal. |
| GET | `/goals/:goalId/projects` | viewer | A goal's projects. |
| GET | `/projects/:id` | viewer | One project, with its path. |

## Settings

| Variable | Default | Effect |
| --- | --- | --- |
| `FORGE_PROJECTS_DIR` | `~/Forge Projects` | Root folder for everything Forge builds. |

## Events

Publishes `project.created`.

## Files

| File | Purpose |
| --- | --- |
| `projects.schema.ts` | The `projects` table (goal, company, absolute repository path). |
| `projects.service.ts` | Create (choosing the folder), list, find. |
| `project-location.ts` | The projects root and folder naming. |
| `projects.controller.ts` | The endpoints above. |
| `dto/create-project.dto.ts` | Request validation. |
| `projects.module.ts` | Wiring; exports `ProjectsService`. |

## Tests

`project-location.spec.ts` (unit); `test/project-workspace.e2e-spec.ts`.

## Related

`goals` (parent), `work` (its steps), `workspaces` (branches, catch-up, merge), `console` (file
browsing and downloads).
