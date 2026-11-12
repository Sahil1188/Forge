# `infrastructure/security/` — network exposure and child-process environments

Anyone who can call Forge's API can make it run code on this machine: agents write and run code, and
acceptance checks are shell commands. This folder holds the two defences that apply to everything:
what the HTTP server accepts, and what environment the code it starts can see.

## How it works

**HTTP (`http-security.ts`, applied in `main.ts` before any route):**

- Listens on `127.0.0.1` by default. Any other address is refused at start-up unless
  `FORGE_API_TOKEN` is set (24+ characters).
- **Host allowlist** blocks DNS rebinding: a web page that points its own name at `127.0.0.1` gets
  `421`.
- **Cross-site writes are refused:** state-changing requests must be JSON and same-origin, so an open
  web page cannot drive the API (CSRF).
- **Token:** `Authorization: Bearer <token>`, or open `/?token=<token>` once in a browser to get an
  `HttpOnly`, `SameSite=Strict` cookie. Compared in constant time.
- Security headers on every response (`nosniff`, `X-Frame-Options: DENY`, no referrer, same-origin
  opener and resource policies, camera/microphone/location off), no `X-Powered-By`.
- A per-client rate limit on writes.

**Child processes (`safe-env.ts`):** agents, their commands and acceptance checks get an **allowlisted**
environment: toolchain variables (`PATH`, `HOME`, proxies, locale…), the Claude Code subscription
token (agents only, never commands), and whatever `FORGE_CHILD_ENV_PASSTHROUGH` adds. Nothing else is
passed, so `DATABASE_URL`, `FORGE_API_TOKEN`, the fallback key and other API keys never reach
agent-run code. The passthrough can never add `ANTHROPIC_API_KEY`, `DATABASE_URL` or
`FORGE_API_TOKEN`, so a stray key can never switch the subscription to per-token billing.

## Settings

| Variable | Default | Effect |
| --- | --- | --- |
| `FORGE_HOST` | `127.0.0.1` | Address to listen on. Non-loopback requires `FORGE_API_TOKEN`. |
| `PORT` | `3000` | Port to listen on. |
| `FORGE_API_TOKEN` | unset | Required token for every non-public request (24+ characters: `openssl rand -hex 32`). |
| `FORGE_ALLOWED_HOSTS` | loopback names | Extra host names to answer to (behind a proxy, a LAN name). |
| `FORGE_WRITE_LIMIT_PER_MINUTE` | `120` | Writes allowed per client per minute. |
| `FORGE_CHILD_ENV_PASSTHROUGH` | empty | Extra variable names agent-run code may see, comma separated. |

## Files

| File | Purpose |
| --- | --- |
| `http-security.ts` | Options from the environment, start-up refusal, and the request middleware. |
| `safe-env.ts` | Builds the allowlisted environment for child processes. |
| `http-security.spec.ts` | Host allowlist, CSRF, token, rate limit, headers. |
| `safe-env.spec.ts` | What is passed through and what is always removed. |

## Related

`main.ts` (applies the middleware), `modules/auth` (accounts and roles on top of this),
`modules/runtimes` and `modules/evaluation` (start child processes with `safe-env`).
See [`SECURITY.md`](../../../SECURITY.md) for the threat model and how to report a vulnerability.
