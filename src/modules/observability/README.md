# `modules/observability/` — serving the console and run views

Serves the web console (the plain ES-module app in `public/`, no build step) and a few read-only views
of employees and runs.

## How it works

- `GET /` and `GET /ui` return `public/index.html`. The console is a single-page app that calls the
  JSON API (mostly `console`).
- `GET /assets/:file` serves files from `public/assets/`. Only flat, allowlisted names are accepted:
  no paths, no traversal, no dotfiles. Responses carry `nosniff` and `no-cache`.
- The overview and run endpoints summarise employees' status, model and latest run without exposing
  raw internals.

## HTTP API

| Method | Path | Role | What it does |
| --- | --- | --- | --- |
| GET | `/` , `/ui` | public | The console. |
| GET | `/assets/:file` | public | Console scripts, styles and fonts. |
| GET | `/companies/:id/overview` | viewer | Each employee's status, model and latest run. |
| GET | `/work-items/:id/runs` | viewer | A step's runs. |
| GET | `/agent-runs/:id` | viewer | One run's summary. |

## Files

| File | Purpose |
| --- | --- |
| `ui.controller.ts` | Serves the console and its assets. |
| `observability.service.ts` | Overview and run summaries. |
| `observability.controller.ts` | The read endpoints above. |
| `observability.module.ts` | Wiring. |

## Tests

`ui.controller.spec.ts` (asset name allowlist), `console-lib.spec.ts` (console helpers);
`test/console-api.e2e-spec.ts`.

## Related

`public/` (the console itself, following `public/DESIGN.md`), `console` (most of its data),
`infrastructure/security` (headers and host checks on every response).
