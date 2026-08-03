# `modules/companies/` — companies & users

The top of the org hierarchy: a human owns a company, which contains everything else.

| File | What it does | Significance |
| --- | --- | --- |
| `companies.schema.ts` | Drizzle tables `users` and `companies` (soft-delete, timestamps). | Root aggregates other tables reference by `companyId`. |
| `companies.service.ts` | Create / list / find-one (soft-delete aware); throws 404 when missing. | Exported so other modules (employees, goals) can verify a company exists. |
| `companies.controller.ts` | `POST /companies`, `GET /companies`, `GET /companies/:id`. | Public CRUD surface. |
| `companies.module.ts` | Wires + **exports** `CompaniesService`. | Lets employees/goals depend on it. |
| `dto/` | Request validation shapes (see its README). | — |

**Relationships:** depended on by `employees`, `goals`, `observability`.
