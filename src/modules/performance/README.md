# `modules/performance/` — performance, reputation, specialization, skill growth

Turns objective evaluation results into a persistent, measurable capability profile — and computes
reputation/specialization on read (spec §13–§16). The other core differentiator vs Paperclip.

Key principle: **store raw measurements, never a precomputed rank.** Reputation is calculated, so the
formula can change without a migration.

| File | What it does | Significance |
| --- | --- | --- |
| `performance.schema.ts` | The `performance_records` table (quality/correctness/reliability/tests/security/eval scores, cost, duration, approval, retries). | The measurement history everything is computed from. |
| `reputation-math.ts` | **Pure** `computeReputation(scores, decay)` (recency-weighted) + `mean`. | The formula, unit-tested; changeable without schema change. |
| `skill-math.ts` | **Pure** `computeSkillDelta(level, score, complexity)` (non-uniform: trivial ≈0, hard high-quality >0, failures decrement, diminishing near 100) + `complexityOf(taskType, priority)`. | Makes skill growth meaningful, not an XP counter. |
| `performance.service.ts` | Derives measurements from an evaluation + run and stores them; queries history. | The only writer of performance data. |
| `reputation.service.ts` | Computed read-model: overall + per-task-type reputation. | What routing/UI read. |
| `specialization.service.ts` | Infers specialties from history (task types with enough high-scoring samples). | Dynamic specialization, not manual labels. |
| `skill-progression.service.ts` | Applies `computeSkillDelta` to the employee's skills after an evaluation. | Grows the capability model. |
| `profile.controller.ts` | `GET /employees/:id/profile` — identity + skills + reputation + specialization + recent performance. | The capability view the UI shows. |
| `performance.module.ts` | Wires + exports the services. | Imported by evaluation + routing. |
| `performance-math.spec.ts` | Unit tests for reputation recency + non-uniform skill growth. | Locks the learning behavior. |

**Relationships:** written by `evaluation`; read by `routing/workforce` (reputation input) and the UI.
Closes the learning loop.
