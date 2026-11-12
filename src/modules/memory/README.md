# `modules/memory/` — what each employee has learned

Durable lessons each employee carries from one task to the next. They come from objective evaluation
results, never from the model's own account of how it did, so the "learning" is trustworthy.

## How it works

- After every scored evaluation, the evaluation worker writes a memory for the employee:
  - a **lesson** when work failed (what broke, with the evidence) — high salience;
  - a **lesson** when work passed after failing (what the problem was and what fixed it);
  - an **outcome** when work passed first time — low salience.
- Before each run, `recall` picks the most relevant memories (up to 5 by default) by salience,
  task-type match and recency, and `recallBlock` renders them into the prompt as "Lessons (never
  repeat these mistakes)".
- Employees also write a short self-reflection at the end of a task; the execution worker stores it.
- No embeddings: ranking is deterministic and needs no extra service.

## HTTP API

| Method | Path | Role | What it does |
| --- | --- | --- | --- |
| GET | `/employees/:employeeId/memories` | viewer | What they have learned (`?taskType=` to filter). |

## Files

| File | Purpose |
| --- | --- |
| `memory.schema.ts` | The `agent_memories` table (kind, task type, content, salience, source run). |
| `memory.service.ts` | `remember`, `recall`, `recallBlock`. |
| `memory.controller.ts` | The endpoint above. |
| `memory.module.ts` | Wiring; exports `MemoryService`. |

## Tests

`memory.service.spec.ts` (unit); `test/memory.e2e-spec.ts`.

## Related

Written by `evaluation` and `workers`; read by `workers` (prompt) and the console's Memory tab.
