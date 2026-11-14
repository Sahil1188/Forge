# `modules/performance/` — measured capability: reputation, skills, specialisation

Turns evaluation results into a profile of what each employee is actually good at. Raw measurements
are stored; reputation and specialisation are computed when read, so the formulas can change without
a migration.

## How it works

- After each scored evaluation, a **performance record** stores the scores (overall, correctness,
  tests, reliability…), cost, duration, retries and approvals for that step.
- **The learning score** (`learningScore` in `skill-math.ts`) is what reputation and skills learn
  from, stored as the record's `evaluationScore` (the raw average stays in `qualityScore`):
  - a **failed** step scores at most 40, below the neutral 60, so it always counts against the
    employee even when most of its checks passed (one failing check of three averages 67);
  - a **pass** loses 10% for each failed attempt before it (up to four), never dropping below
    neutral: passing first time is worth 100, passing on the fifth try 60;
  - retries are failed evaluations of the step, not extra runs (a run that continued after a time
    limit is the same attempt).
- **Reputation** is a recency-weighted average of learning scores, overall and per task type.
- **Skills** move after each evaluation, non-uniformly: high-quality work on hard steps raises them
  most, trivial work barely moves them, failures lower them, and growth slows near 100. Only the
  skills the step exercised move: those matching its domain's skill hints (`skillFitsTask` in
  `work/domains.ts`, the same rule routing uses). Work of a kind with no hints moves none.
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

Written by `evaluation`; read by the console (Profile tab) and by `routing`, where reputation is 15% of a candidate's score (newcomers count as a neutral 60).
