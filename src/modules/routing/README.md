# `modules/routing/` — who does the work, and on which model

Two separate decisions:

- **Workforce Router** (`workforce/`): *who* should do this step?
- **Omni Router** (`omni/`): *what* runtime, provider and model should run it?

## How it works

**Workforce Router** scores every employee in the company for a step:

- skill match against the step's domain, role fit (or sitting in the department that owns the
  domain), and availability (fewer active items wins);
- only employees whose runtime can actually run right now are considered (see
  `runtimes/runtime-availability.ts`);
- executives plan; they get execution work only when nobody else can do it;
- people can be excluded, for example the builder from an independent review.

**Omni Router** resolves the model from the employee's model policy, in order: an explicit mapping for
the task type, then the complexity tier (a strong model for hard work, a cheaper one for simple
work), then the default. For Claude Code employees that means which Claude model; for custom-runtime
employees it also picks the provider. When Claude is at its usage limit, the execution worker swaps
in the fallback endpoint (see `runtimes/usage-limits.ts`).

## HTTP API

| Method | Path | Role | What it does |
| --- | --- | --- | --- |
| POST | `/work-items/:id/route` | admin | Assigns the step to the best-fit employee. |

## Files

| File | Purpose |
| --- | --- |
| `workforce/scoring-workforce-router.service.ts` | Scores and picks the employee. |
| `workforce/candidate-scoring.ts` | The pure scoring rules (skill, role, department, availability). |
| `workforce/workforce-router.port.ts` | The router interface and DI token. |
| `omni/dynamic-omni-router.service.ts` | Resolves runtime, provider and model from the policy. |
| `omni/omni-router.port.ts` | The router interface and DI token. |
| `routing.controller.ts` | The endpoint above. |
| `routing.module.ts` | Binds both ports to their implementations. |

## Tests

`routing.spec.ts`, `routing.edge.spec.ts`, `workforce/execution-pool.spec.ts` (unit);
`test/routing.e2e-spec.ts`.

## Related

`heartbeats` (routes every planned step), `workers` (model per run), `employees` (skills, policy),
`runtimes` (availability), `work` (assignment).
