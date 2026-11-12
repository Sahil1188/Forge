# `modules/health/` — is Forge up?

`GET /health` answers whether the process is running and the database is reachable (it runs
`select 1`). Monitors and CI use it; it needs no sign-in.

## HTTP API

| Method | Path | Role | What it does |
| --- | --- | --- | --- |
| GET | `/health` | public | `{ status, db }`. |

## Files

| File | Purpose |
| --- | --- |
| `health.service.ts` | The database check. |
| `health.controller.ts` | The endpoint. |
| `health.module.ts` | Wiring. |

## Tests

`health.service.spec.ts` (unit, with a mocked database).
