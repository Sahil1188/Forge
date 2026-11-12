# `modules/employees/` — the workforce

An employee is a database record, not a process and not tied to one model. The record holds who they
are (name, role, department, manager), how they run (runtime and model policy), what they are good at
(skill levels), what they may do (tool permissions), and the **brief** they work under.

## How it works

- **The brief** is the professional profile every task starts with: mission, standards, way of
  working, definition of done, "never" rules, when to escalate, and what they hand back.
  - `employee-briefs.ts` holds the built-in briefs for the default organisation, matched by name, then
    by exact role.
  - A brief can be edited per employee in the console (Brief tab). The edited brief is stored on the
    employee (`brief_json`) and wins over the built-in one from their next task on. Resetting removes
    it and the built-in brief applies again.
  - The prompt is assembled in a fixed order so it caches well: shared rules, Forge rules, the brief,
    time budget, brand, lessons, task standards, then the task.
- **Skills** are levels 0–100 per skill. Routing prefers relevant skills; evaluated work moves them up
  or down (see `performance`). They can also be set by hand.
- **Runtime config** picks the runtime (`claude_code` or `custom`), the provider and the model policy
  read by the Omni Router.
- **Governance** (`governance_json`) lists tools that need approval, are denied, or are the only ones
  allowed (see `governance`).
- Removing an employee is a soft delete, refused while they have active work or direct reports.

## HTTP API

| Method | Path | Role | What it does |
| --- | --- | --- | --- |
| POST | `/companies/:companyId/employees` | admin | Hires an employee (optional runtime config and skills). |
| GET | `/companies/:companyId/employees` | viewer | Everyone in the company. |
| GET | `/employees/:id` | viewer | One employee with skills and runtime config. |
| PATCH | `/employees/:id` | admin | Changes profile, manager, runtime or permissions. |
| PUT | `/employees/:id/skills` | admin | Replaces their skill levels. |
| GET | `/employees/:id/brief` | viewer | `{ brief, custom, builtIn }`: the brief in use, whether it was edited, and the built-in one. |
| PUT | `/employees/:id/brief` | admin | Saves an edited brief (validated; blank lines dropped). |
| DELETE | `/employees/:id/brief` | admin | Goes back to the built-in brief. |
| DELETE | `/employees/:id` | admin | Removes the employee (history is kept). |

## Files

| File | Purpose |
| --- | --- |
| `employees.schema.ts` | `employees` (with `brief_json`), `employee_runtime_configs`, `employee_skills`; the `ModelPolicy` type. |
| `employees.service.ts` | Create, update, skills, brief read/save/reset, soft delete; `findOne` returns the employee with skills and runtime config. |
| `employees.controller.ts` | The endpoints above. |
| `employee-briefs.ts` | Shared rules, built-in briefs, `briefForEmployee` (edited brief first), `renderBrief`. |
| `dto/create-employee.dto.ts` | Request validation, including `EmployeeBriefDto`. |
| `employees.module.ts` | Wiring; exports `EmployeesService`. |

## Tests

`employee-briefs.spec.ts` (every default employee has a complete brief; edited briefs win and keep the
model tier); `test/employees.e2e-spec.ts` (hiring, skills, brief edit/validate/reset);
`test/execution-lifecycle.e2e-spec.ts` (an edited brief reaches the next task's prompt).

## Related

The most depended-on module: `routing` (skills, model policy), `workers` and `heartbeats` (briefs in
the prompt), `governance` (permissions), `performance` (skill growth), `console` (team views, starter
team).
