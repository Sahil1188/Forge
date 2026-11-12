# `modules/auth/` — accounts, roles and the access guard

Decides who may call which endpoint. With no accounts set up, Forge is a single-operator app on
`127.0.0.1` and every request is allowed (the server refuses to listen anywhere else without a token,
see `infrastructure/security`). Once the first account is created, every request needs a session
and a role in the company it touches.

## How it works

- **Roles per company**, ranked `viewer < member < admin < owner`:
  - `viewer` reads anything in the company.
  - `member` gives work, requests changes, starts, retries and cancels work.
  - `admin` manages employees (including their briefs), budgets, permissions, approvals,
    assignment, company settings, brands, drain mode and the fallback drill.
  - `owner` manages people and their access (member lists are owner-only, even to read).
- `access-policy.ts` maps each method + path to the role it needs (`requiredRole`) and finds the
  record a path is about (`resourceOf`), whose company decides access.
- `access.guard.ts` is a global guard. Public routes (`/`, `/ui`, `/assets/*`, `/health`, sign-in)
  skip it. Everything else needs a signed-in session, or the `FORGE_API_TOKEN` bearer token.
- Passwords are hashed with scrypt (salt + hash). Sessions are random tokens in an `HttpOnly`,
  `SameSite=Strict` cookie, stored hashed.

## HTTP API

| Method | Path | Role | What it does |
| --- | --- | --- | --- |
| GET | `/auth/status` | public | Whether accounts are on, who is signed in, their companies. |
| POST | `/auth/setup` | public, once | Creates the first (owner) account. Refused once any account exists. |
| POST | `/auth/login` | public | Signs in; sets the session cookie. |
| POST | `/auth/logout` | public | Ends the session. |
| GET | `/companies/:id/members` | owner | People with access to the company. |
| POST | `/companies/:id/members` | owner | Gives a person a role. |
| PATCH | `/companies/:id/members/:userId` | owner | Changes their role. |
| DELETE | `/companies/:id/members/:userId` | owner | Removes their access. |

## Settings

| Variable | Default | Effect |
| --- | --- | --- |
| `FORGE_API_TOKEN` | unset | A token that acts as full access (for API clients and remote use). |
| `FORGE_SECURE_COOKIES` | `0` | `1` adds `Secure` to the session cookie. Set it when Forge is served over HTTPS. |

## Files

| File | Purpose |
| --- | --- |
| `auth.schema.ts` | `company_members` (role per person per company) and `sessions` tables; the `Role` ranking. |
| `auth.service.ts` | Accounts, password hashing, sessions, memberships. |
| `auth.controller.ts` | The endpoints above. |
| `access-policy.ts` | Pure rules: public paths, the role each request needs, which record it is about. |
| `access.guard.ts` | Applies the policy to every request. |
| `auth.module.ts` | Registers the guard globally. |

## Tests

`test/auth-access.e2e-spec.ts` covers setup, sign-in, every role boundary and the single-operator
mode.

## Related

`companies` (users live there), `infrastructure/security` (network exposure and the token),
every controller (all are covered by the guard).
