# `infrastructure/` — cross-cutting plumbing

Non-domain foundations every feature module builds on. No business logic here.

| Subfolder | What it provides |
| --- | --- |
| [`database/`](database/README.md) | PostgreSQL + Drizzle connection, the schema barrel, migration + seed scripts. |
| [`events/`](events/README.md) | The transactional outbox, the in-process EventBus, and the dispatcher that bridges them. |
| [`security/`](security/README.md) | HTTP hardening (host, CSRF, token, headers, rate limit) and safe environments for child processes. |
