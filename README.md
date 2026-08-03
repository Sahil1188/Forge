# Forge — Autonomous AI Workforce Operating System

An AI workforce that learns which employees, runtimes, and models perform best for
different types of work — and gets measurably better at assigning work over time.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and
[`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md).

**New to the code?** Read [`docs/FLOW.md`](docs/FLOW.md) — an end-to-end, file-by-file walkthrough of
how a goal becomes executed, evaluated work. Every folder under `src/` also has its own `README.md`
describing each file and its significance (start at [`src/README.md`](src/README.md) →
[`src/modules/README.md`](src/modules/README.md)).

## Stack

NestJS + TypeScript · PostgreSQL + Drizzle · Claude Agent SDK (`ClaudeCodeRuntime`) ·
modular monolith with in-process workers.

## Prerequisites

- Node.js 22+
- Docker (for local PostgreSQL)

## Getting started (M0)

```bash
npm install
npm run db:up        # start PostgreSQL (docker compose)
npm run db:migrate   # apply migrations (none until M1)
npm run start:dev    # start the API
```

> PostgreSQL is published on host port **5433** (not 5432) to avoid colliding with a
> native Postgres install. `DATABASE_URL` in `.env` already points at 5433.

Then check health (verifies DB connectivity):

```bash
curl http://localhost:3000/health
# {"status":"ok","db":"up"}
```

## Dashboard

With the app running, open **http://localhost:3000/ui** — a minimal console showing each
employee's status, model, and latest run, plus a computed profile (reputation, specialization,
skills) per employee. Enter a company id (from `POST /companies`) and load.

## The V1 vertical slice (§27)

The end-to-end story — create company → CEO (Claude Code/Opus) plans a goal → work routed to a
developer (Claude Code/Sonnet) → executed in an isolated git workspace → evaluated with the repo's
real build/test → performance/reputation updated → surfaced in the UI — is covered by
`test/vertical-slice.e2e-spec.ts`. It runs against a mock registered under the real `claude_code`
runtime key, so it needs no live SDK. To run the same flow against **real** Claude Code, set
`CLAUDE_CODE_OAUTH_TOKEN` (see `test/claude-code-live.e2e-spec.ts`).

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run build` | Compile the monolith (`nest build`) |
| `npm test` | Run the Vitest suite |
| `npm run db:up` / `db:down` | Start / stop local PostgreSQL |
| `npm run db:generate` | Generate a Drizzle migration from schema changes |
| `npm run db:migrate` | Apply pending migrations |
| `npm run lint` / `format` | Lint / format |

## Auth note (Claude Code runtime, M3+)

`ClaudeCodeRuntime` runs on the **Claude Code subscription session** (local OAuth, or
`CLAUDE_CODE_OAUTH_TOKEN` in CI). **Do not set `ANTHROPIC_API_KEY`** for this path — it
overrides subscription billing. See `docs/ARCHITECTURE.md` §7.1.
