# `modules/evaluation/` — objective checks before work is accepted

An employee never certifies its own work. When a step finishes, Forge runs the project's real checks
(lint, typecheck, tests, build), the step's own acceptance commands, and the acceptance commands of
every step already finished in the project. Work that fails goes back to the same employee with the
failing output. Work that passes is merged into the project's `main`, which is the deliverable.

## How it works

1. **Catch up with `main`.** The latest `main` is merged into the step's branch first, so it is checked
   as the code `main` will actually become, including work other steps merged meanwhile. A conflict
   sends the step back with the conflict to resolve.
2. **Project checks.** `script-discovery.ts` finds `lint`, `typecheck`, `test` and `build` in
   `package.json`. Each scores 100 (exit 0) or 0.
3. **Acceptance checks.** The step's own commands (`acceptance#n`), then every finished step's
   commands (`regression#n`). A failing regression check names the step it belongs to, so the
   employee knows what they broke. Commands are run once each, and skipped this round when the project
   checks already fail.
4. **Broken checks.** A check that cannot run at all (a script with a syntax error, a missing program)
   is reported as invalid instead of failing the work. An earlier step's broken check is skipped.
5. **Visual review** for frontend, design and review steps (`visual/`): the app is started, every
   screen is screenshotted in a real browser, and a designer reviews the screenshots against a design
   rubric and the project's brand checklist. A score below the bar fails the step.
6. **Route.** Passed: merge into `main`; the goal completes when every step is done. Failed: back to
   the employee, up to the attempt limit (runs stopped by usage limits, productive limit stops and
   fallback runs do not count; see `runtimes/attempts.ts`).
7. **Learn.** Every scored evaluation updates the employee's performance record and skills and writes a
   lesson to their memory: what broke, or what fixed it.

Command output is redacted for secrets before it is stored.

## HTTP API

| Method | Path | Role | What it does |
| --- | --- | --- | --- |
| GET | `/work-items/:workItemId/evaluations` | viewer | Every evaluation of a step, newest first. |
| GET | `/evaluations/:id` | viewer | One evaluation with each check's output. |

## Settings

| Variable | Default | Effect |
| --- | --- | --- |
| `FORGE_MAX_ATTEMPTS` | `3` | Failed attempts before a step is marked failed. |
| `FORGE_MAX_REGRESSION_CHECKS` | `30` | Earlier steps' checks re-run per evaluation. |
| `FORGE_VISUAL_GATE` | on | `0` turns the visual review off. |
| `FORGE_VISUAL_MIN_SCORE` | `85` | Score a screen review must reach. |
| `FORGE_VISUAL_MODEL` | `opus` | Model used for the visual review. |
| `FORGE_BROWSER_PATH` | auto | Chrome, Edge or Chromium used for screenshots. |
| `FORGE_SANDBOX` | `host` | `docker` runs checks in a network-less container (see `runtimes`). |

## Events

Subscribes to `work.status_changed` (to `evaluating`). Writes status changes through `work`.

## Files

| File | Purpose |
| --- | --- |
| `evaluation.worker.ts` | Catch-up, checks, visual review, routing, merge, performance, skills and memory. |
| `evaluation-engine.ts` | Runs project, acceptance and regression checks and scores them; detects broken checks. |
| `script-discovery.ts` | Finds the project's checks in `package.json`. |
| `command-runner.ts` | Runs one check with the safe environment and a time limit. |
| `visual/visual-gate.ts` | The visual review: rubric, brand checklist, reviewer choice. |
| `visual/app-launcher.ts` | Finds a browser, starts the app (or a static server) and stops it again. |
| `visual/shoot-script.ts` | The screenshot script run in the browser. |
| `evaluation.schema.ts` | The `evaluations` table. |
| `evaluations.service.ts` | Stores and reads evaluations. |
| `evaluation.controller.ts` | The endpoints above. |

## Tests

`evaluation-engine.spec.ts`, `evaluation-engine.edge.spec.ts`, `broken-check.spec.ts` and
`visual/visual-tools.spec.ts` (unit); `test/evaluation.e2e-spec.ts` and
`test/project-workspace.e2e-spec.ts` (merging, regressions, parallel steps).

## Related

`workspaces` (catch-up and merge), `runtimes` (attempt rules), `performance` and `memory` (learning),
`brands` (checklist), `work` (status).
