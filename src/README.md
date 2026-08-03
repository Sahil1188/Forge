# `src/` — application root

The Forge backend: a modular NestJS monolith. Start with [`docs/FLOW.md`](../docs/FLOW.md) for the
end-to-end flow, then read each folder's `README.md`.

| File | What it does | Significance |
| --- | --- | --- |
| `main.ts` | Bootstraps the Nest app: `reflect-metadata`, global `ValidationPipe`, shutdown hooks, listens on `PORT`. | The process entry point. |
| `app.module.ts` | The root module — imports every infrastructure + feature module and wires the graph. | The single place that shows what the app is made of; add a module here to activate it. |

## Layout

- `infrastructure/` — cross-cutting plumbing (database, events). Not domain logic.
- `modules/` — one folder per bounded context (companies, employees, work, runtimes, routing, …). Each is a self-contained NestJS module exposing a service/port to others.
- `workers/` — background orchestration (the execution worker + listeners) that drives runtimes.

## Conventions

- Every module owns its own `*.schema.ts` (Drizzle tables), re-exported by `infrastructure/database/schema.ts`.
- Cross-module calls go through an exported **service or port interface**, never another module's internals — so a module can become a standalone service later.
- Pure logic (scoring, math, state machines, redaction) lives in dependency-free files with `.spec.ts` unit tests; DB/IO wrappers sit on top.
- Background auto-triggers (event subscribers, intervals) are gated off under the test runner (`process.env.VITEST`); tests drive workers directly for determinism.
