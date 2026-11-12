# `modules/heartbeats/` — turning a goal into a plan

When a goal starts, the executive who owns its domain wakes up and plans it: one project, a short list
of steps with owners, dependencies and acceptance checks, and a brand for the UI. Forge then creates
the work and routes every step to the best-fit employee.

## How it works

1. **Who plans:** the executive heading the department that owns the goal's domain (a finance model
   goes to the CFO, a security review to the CISO), else the CEO. Only executives plan.
2. **The planning run** happens in its own workspace, with the executive's brief and the planning
   rules. It writes `PLAN.json`. If Claude is at its usage limit, planning uses the fallback endpoint.
3. **Planning rules** (in the prompt): usefulness first (a real user's job, end to end); one small
   contract step first (at most 15 minutes: skeleton, shared types, schema, API contract), then
   features in parallel; no dependency chain longer than 3 before the final review; each step says
   which folders it owns so parallel steps don't overlap; at most `FORGE_MAX_PLAN_ITEMS` steps.
4. **Shaping** (`plan-shaping.ts`): the model's output is sanitised (titles, task types, checks),
   capped, and its dependencies resolved to earlier steps only. The goal's own acceptance checks are
   attached to the last step.
5. **Hiring:** the plan may ask for specialists the company lacks (up to `FORGE_MAX_HIRES_PER_GOAL`);
   they are created reporting to the planner.
6. **Brand:** applied to the goal and committed to the project as `BRAND.md` (see `brands`).
7. **Production review:** unless the plan already ends with a review, a final independent review step
   is added. The reviewer is never the builder.
8. If the plan cannot be read, Forge still creates one "Deliver" step, so a goal never stalls.

## HTTP API

| Method | Path | Role | What it does |
| --- | --- | --- | --- |
| POST | `/goals/:id/plan` | member | Plans a goal now (also happens automatically on start). |

## Settings

| Variable | Default | Effect |
| --- | --- | --- |
| `FORGE_MAX_PLAN_ITEMS` | `12` | Most steps a plan may have. |
| `FORGE_MAX_HIRES_PER_GOAL` | `2` | Specialists a planner may hire per goal (`0` disables hiring). |
| `FORGE_PRODUCTION_REVIEW` | on | `0` skips the final independent review step. |
| `FORGE_MANUAL_DRIVE` | unset | Set to stop planning automatically on `goal.started`. |

## Events

Subscribes to `goal.started`.

## Files

| File | Purpose |
| --- | --- |
| `ceo-planner.service.ts` | Choosing the planner, the planning run and prompt, creating work, hiring, brand, review step. |
| `plan-shaping.ts` | Pure sanitising, capping and dependency resolution of a plan. |
| `heartbeat.worker.ts` | Records the wake-up and runs the planner on `goal.started`; recovers crashed planning. |
| `heartbeats.schema.ts` | The `heartbeats` table. |
| `heartbeats.controller.ts` | The endpoint above. |
| `heartbeats.module.ts` | Wiring. |

## Tests

`plan-shaping.spec.ts` (unit); `test/planner.e2e-spec.ts`, `test/heartbeat.e2e-spec.ts`,
`test/brands.e2e-spec.ts`.

## Related

`goals`, `projects`, `work`, `routing` (assigns each step), `runtimes` and `workspaces` (the planning
run), `employees` (briefs, hiring), `brands`.
