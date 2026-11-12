# `modules/console/` — what the web console reads and does

The API behind the web console (`public/`). It turns the raw records (goals, work items, runs,
evaluations, files) into the views people use: the dashboard, the goal board, live activity,
transcripts, project files and downloads. It also handles change requests on delivered work, the
starter team, and **Ask Forge**, where you ask questions about a company or a goal in plain words.

## How it works

- **Live activity:** what a running employee is doing right now is read from the run's live
  transcript (`summariseLive`).
- **Change requests** (`POST /goals/:id/changes`): feedback on delivered work becomes one targeted
  work item on the same project. Its acceptance checks include the checks of every earlier step, so
  the change cannot break what already works.
- **Starter team:** creates the default organisation (`org-template.ts`): an executive per department
  and their specialists, each with a built-in brief.
- **Ask Forge:** answers come from a model that can only read. It gets a plain-text briefing of the
  company or goal (`ask-briefing.ts`) and read-only tools on the project (`readOnlyGate` refuses any
  write or command). Questions and answers are stored per company.
- **Project files:** only files git tracks in the project's `main` can be read or downloaded; any
  other path is a 404, so nothing outside the deliverable is reachable.

## HTTP API

| Method | Path | Role | What it does |
| --- | --- | --- | --- |
| GET | `/system` | viewer | Version, auto-run, sandbox in use, usage limits per runtime, which runtimes can run. |
| GET | `/companies/:id/dashboard` | viewer | Headline numbers, active goals, recent activity. |
| GET | `/companies/:id/team` | viewer | Everyone, with what they are working on. |
| GET | `/companies/:id/approvals` | viewer | Pending approvals. |
| GET | `/companies/:id/runs` | viewer | Recent runs across the company. |
| GET | `/companies/:id/projects` | viewer | Projects and where they live on disk. |
| GET | `/employees/:id/runs` | viewer | One employee's runs. |
| GET | `/goals/:id/board` | viewer | Every step of a goal with runs, cost and evaluation. |
| GET | `/agent-runs/:id/transcript` | viewer | A run's transcript (live while it runs). |
| GET | `/projects/:id/files` | viewer | The project's file tree. |
| GET | `/projects/:id/file` | viewer | One file's content (`?path=`); large or binary files are flagged, not sent. |
| GET | `/projects/:id/download` | viewer | Downloads one file (`?path=`), up to 50 MB. |
| GET | `/companies/:id/ask` | viewer | The Ask Forge conversation. |
| POST | `/companies/:id/ask` | member | Asks a question (`{ question, goalId? }`). |
| POST | `/companies/:id/starter-team` | admin | Creates the default organisation. |
| POST | `/goals/:id/changes` | member | Requests a change on delivered work (`{ feedback, workItemId? }`). |
| POST | `/work-items/:id/retry` | member | Puts a failed step back to work, continuing from its last attempt. |

## Settings

Reads `FORGE_FALLBACK_BASE_URL` / `FORGE_FALLBACK_MODEL` (shown on `/system`), `FORGE_SANDBOX` and
`FORGE_AGENT_SANDBOX` (shown as the isolation in use). See `runtimes` and `workers` for their effect.

## Files

| File | Purpose |
| --- | --- |
| `console.service.ts` | Every view above, live activity, change requests, retries, file access. |
| `console.controller.ts` | The endpoints above. |
| `org-template.ts` | The default organisation. |
| `ask.service.ts` | Ask Forge: read-only model run, stored conversation. |
| `ask-briefing.ts` | The plain-text briefing handed to that model. |
| `ask.schema.ts` | The `ask_messages` table. |
| `console.module.ts` | Wiring. |

## Tests

`ask.spec.ts` and `live-activity.spec.ts` (unit); `test/console-api.e2e-spec.ts` and
`test/ask.e2e-spec.ts` (end to end).

## Related

Reads from nearly every module; writes through `work` (change requests, retries) and `employees`
(starter team).
