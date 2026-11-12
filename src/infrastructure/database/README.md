# `infrastructure/database/` — PostgreSQL connection, migrations and seed

Owns the database connection and the migration and seed scripts. No domain logic: feature modules
inject the `DRIZZLE` handle and define their own tables in their `*.schema.ts` files.

## How it works

- PostgreSQL through `postgres.js`, wrapped by Drizzle ORM. The pool is opened once and closed on
  shutdown.
- `schema.ts` re-exports every module's tables. `drizzle-kit` reads it to generate migrations into the
  top-level `drizzle/` folder. Add a new table's export there.
- Migrations are forward only. `npm run db:generate` creates one from schema changes;
  `npm run db:migrate` applies pending ones.
- `npm run db:seed` creates a small demo company to explore the console with.

## Settings

| Variable | Default | Effect |
| --- | --- | --- |
| `DATABASE_URL` | `postgres://forge:forge@127.0.0.1:5433/forge` (`.env.example`) | Connection string for the app, migrations and seed. |

`docker-compose.yml` starts a matching PostgreSQL on port 5433 (`npm run db:up`).

## Files

| File | Purpose |
| --- | --- |
| `drizzle.provider.ts` | `DRIZZLE` and `PG_CLIENT` tokens, the `Database` type, the providers. |
| `database.module.ts` | Global module exposing the handle; closes the pool on shutdown. |
| `schema.ts` | Every table, for Drizzle and `drizzle-kit`. |
| `connection.ts` | A standalone connection for scripts. |
| `migrate.ts` | `npm run db:migrate`. |
| `seed.ts` | `npm run db:seed`. |

## Related

Every feature module (through `DRIZZLE`); `drizzle/` (generated SQL); `drizzle.config.ts`.
