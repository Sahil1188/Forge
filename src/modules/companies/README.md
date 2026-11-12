# `modules/companies/` — companies and users

The top of the hierarchy. A company contains its employees, goals, projects and everything they
produce. Whoever creates a company owns it.

## How it works

- A company has a name, a description, an owner, and an optional default **brand** (a slug from
  `brands/`) that its products' UIs follow unless a goal names another. An empty brand lets the planner
  pick one per product.
- Users (people who can sign in) live here too; their access per company is in `auth`.
- Deleting is a soft delete; lookups ignore deleted companies and return 404.

## HTTP API

| Method | Path | Role | What it does |
| --- | --- | --- | --- |
| POST | `/companies` | signed in | Creates a company; the creator becomes its owner. |
| GET | `/companies` | signed in | The companies you can see. |
| GET | `/companies/:id` | viewer | One company. |
| PATCH | `/companies/:id` | admin | Changes name, description or default brand (validated against `brands/`). |

## Files

| File | Purpose |
| --- | --- |
| `companies.schema.ts` | `users` (scrypt password hash; null for people who cannot sign in) and `companies` (with `brand`). |
| `companies.service.ts` | Create, list, find, update; brand validation. |
| `companies.controller.ts` | The endpoints above. |
| `dto/create-company.dto.ts` | Request validation. |
| `companies.module.ts` | Wiring; exports `CompaniesService`. |

## Tests

`test/employees.e2e-spec.ts`, `test/auth-access.e2e-spec.ts`, `test/brands.e2e-spec.ts`.

## Related

Every company-scoped module (`employees`, `goals`, `projects`…), `auth` (membership), `brands`.
