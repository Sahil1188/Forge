# `modules/health/` — liveness/readiness

A trivial module proving the app and its DB connection are up (built in M0 as the CI smoke gate).

| File | What it does | Significance |
| --- | --- | --- |
| `health.service.ts` | Runs `select 1` against the DB; returns `{ status, db }`. | Confirms real DB connectivity, not just process liveness. |
| `health.controller.ts` | `GET /health`. | The endpoint monitors/CI hit. |
| `health.module.ts` | Wires the controller + service. | — |
| `health.service.spec.ts` | Unit tests (mocked DB) for up/down. | Demonstrates the DB-free unit-test pattern used across the repo. |
