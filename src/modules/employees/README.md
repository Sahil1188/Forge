# `modules/employees/` — the workforce

An **employee is a database record + state**, not a process and not bound to one model (spec §2).
Holds identity, reporting line, runtime configuration, skills, and governance.

| File | What it does | Significance |
| --- | --- | --- |
| `employees.schema.ts` | Tables `employee_runtime_configs`, `employees` (self-referencing `managerEmployeeId`, `status`, `autonomy_json`, `governance_json`), `employee_skills`. Defines the `ModelPolicy` type. | The core capability record. `runtimeKey` picks the runtime; `modelPolicy` feeds the Omni Router; `governance` feeds the tool gate; `skills` feed the Workforce Router. |
| `employees.service.ts` | Create an employee (optionally with an inline runtime config + skills), list by company, find-one assembling `{ ...employee, skills, runtimeConfig }`. | The read model every router/worker uses to learn how an employee runs. |
| `employees.controller.ts` | `POST/GET /companies/:companyId/employees`, `GET /employees/:id`. | CRUD surface. |
| `employees.module.ts` | Wires + **exports** `EmployeesService`. | Used by routing, heartbeats, workers, observability, performance. |
| `dto/` | Request validation (see its README). | — |

**Relationships:** the most widely-depended-on domain module. Its `ModelPolicy` (in the schema) is
read by `routing/omni`, and `governance_json` by `governance` + `workers`.
