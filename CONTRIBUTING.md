# Contributing to Forge

Thanks for helping. This guide covers how to set up, the standards a change must meet, and how to send
it.

## Set up

```bash
npm install
cp .env.example .env
npm run db:up                    # PostgreSQL on port 5433
npm run db:migrate
# end-to-end tests use a separate database:
docker exec forge-postgres psql -U forge -c "create database forge_test"
DATABASE_URL=postgres://forge:forge@127.0.0.1:5433/forge_test npm run db:migrate
```

Read [`docs/FLOW.md`](docs/FLOW.md) first; then the README in the folder you are changing.

## Before you open a pull request

All of these must pass; CI runs the same commands:

```bash
npm run typecheck
npm run lint
npm run format:check             # npm run format to fix
npm test                         # unit
npm run test:e2e                 # end to end (needs the forge_test database)
npm run build
```

## Standards

- **TypeScript strict.** No `any` without a comment saying why.
- **Tests with every change.** Pure logic gets a unit test next to it (`*.spec.ts`); behaviour across
  modules gets an end-to-end test in `test/`. A bug fix starts with a test that fails without it.
- **Small, focused changes.** One concern per pull request. No drive-by refactors.
- **Schema changes** go through `npm run db:generate`; commit the generated migration in `drizzle/`.
  Migrations are forward only.
- **Settings** are environment variables named `FORGE_*`, with a safe default, documented in
  `.env.example` and in the module's README.
- **Security first.** Anything that starts a process uses the allowlisted environment
  (`infrastructure/security/safe-env.ts`). Anything that reads a path confines it. Anything stored is
  redacted. Never read `ANTHROPIC_API_KEY`.
- **The console** (`public/`) is plain ES modules with no build step and follows
  [`public/DESIGN.md`](public/DESIGN.md): its tokens only, light theme only, no animation. Every value
  rendered goes through the `html` template, which escapes it.
- **Docs.** If you change what a module does, its endpoints or its settings, update its README.
- **Comments** explain why, not what. When a rule exists because of something observed, say so.

## Commits and pull requests

- Commit messages: a short imperative summary (`fix: …`, `feat: …`, `docs: …`), then the why.
- Fill in the pull request template: what changed, why, how you tested it.
- Keep pull requests reviewable; split large ones.

## Reporting bugs and ideas

Use the issue templates. For security issues, follow [SECURITY.md](SECURITY.md) instead of opening an
issue.

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE) and
that you follow the [Code of Conduct](CODE_OF_CONDUCT.md).
