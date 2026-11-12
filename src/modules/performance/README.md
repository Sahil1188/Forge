# `modules/performance/` — measured capability: reputation, skills, specialisation

Turns evaluation results into a profile of what each employee is actually good at. Raw measurements
are stored; reputation and specialisation are computed when read, so the formulas can change without
a migration.

## How it works

- After each scored evaluation, a **performance record** stores the scores (overall, correctness,
  tests, reliability…), cost, duration, retries and approvals for that step.
- **Reputation** is a recency-weighted average of those scores, overall and per task type.
- **Skills** move after each evaluation, non-uniformly: high-quality work on hard steps raises them
  most, trivial work barely moves them, failures lower them, and growth slows near 100.
- **Specialisation** is inferred from history: task types with enough high-scoring samples.
- The profile endpoint combines identity, skills, reputation, specialisation and recent records.

## HTTP API

| Method | Path | Role | What it does |
| --- | --- | --- | --- |
| GET | `/employees/:id/profile` | viewer | The employee's capability profile. |

## Files

| File | Purpose |
| --- | --- |
| `performance.schema.ts` | The `performance_records` table. |
| `performance.service.ts` | Derives and stores a record from an evaluation and its run. |
| `reputation-math.ts` / `reputation.service.ts` | Recency-weighted reputation. |
| `skill-math.ts` / `skill-progression.service.ts` | Non-uniform skill change. |
| `specialization.service.ts` | Specialisation from history. |
| `profile.controller.ts` | The endpoint above. |
| `performance.module.ts` | Wiring; exports the services. |

## Tests

`performance-math.spec.ts`, `performance-math.edge.spec.ts` (unit); `test/performance.e2e-spec.ts`.

## Related

Written by `evaluation`; read by the console (Profile tab). Reputation is wired into `routing` with a weight of 0 for now, so it does not yet change who gets work.
