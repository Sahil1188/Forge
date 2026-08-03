# `infrastructure/database/` — PostgreSQL + Drizzle plumbing

Owns the database connection and migration/seed tooling. No domain logic — feature modules import
the `DRIZZLE` handle and define their own tables.

| File | What it does | Significance |
| --- | --- | --- |
| `drizzle.provider.ts` | Defines the `DRIZZLE` and `PG_CLIENT` DI tokens, the `Database` type, and the providers that open the postgres.js pool and wrap it with Drizzle. | Every service injects `@Inject(DRIZZLE)` to talk to the DB. |
| `database.module.ts` | `@Global` module exposing those providers; closes the pool on shutdown. | Makes the DB handle available app-wide without re-importing. |
| `schema.ts` | The **barrel** that re-exports every module's `*.schema.ts`. | The one import `drizzle-kit` reads to generate migrations, and what `drizzle(client, { schema })` uses. Add a new table's export here. |
| `connection.ts` | `createDb()` — a standalone Drizzle connection for scripts that run outside Nest. | Used by `migrate.ts` and `seed.ts`. |
| `migrate.ts` | `npm run db:migrate` — applies pending migrations from `drizzle/`; tolerant of the pre-migration state; silences harmless notices. | Forward-only schema application. |
| `seed.ts` | `npm run db:seed` — inserts a demo company: a CEO + Backend Engineer on Claude Code, and a worker on CustomRuntime (the org runtime split). | A ready-made org to exercise the UI/flow. |

**Relationships:** everything here is consumed by feature modules (via `DRIZZLE`) and by the CLI
scripts. Migrations themselves live in the top-level `drizzle/` folder (generated SQL).
