# `memory/` — long-term agent memory

Durable, retrievable lessons each employee carries **across** runs (spec §15). This is distinct from
the *episodic* record (agent runs + transcripts, which say what happened): memory is the distilled,
rankable knowledge injected into the next run's context so an employee gets better with experience.

Memories are written **objectively** from evaluation outcomes — never self-narrated by the model — so
the "learning" signal is as trustworthy as the reputation/skill signals.

| File | What it does | Significance |
| --- | --- | --- |
| `memory.schema.ts` | The `agent_memories` table: per-employee `kind` (outcome/lesson/preference/fact), optional `taskType`/`skillKey`, `content`, `salience` (0–100), `sourceRunId`. | The store. Failures get high salience — you learn most from what broke. |
| `memory.service.ts` | `remember()` writes a memory; `recall()` ranks the top memories for a task (salience + task-type relevance + recency decay, no embeddings in V1); `recallBlock()` renders a CLAUDE.md-ready block. | Deterministic, dependency-free recall; a vector store can slot in behind the same interface later. |
| `memory.controller.ts` | `GET /employees/:id/memories` (optionally `?taskType=`) — the read-side view of what an employee has learned. | Observability into the learning loop. |
| `memory.module.ts` | Exports `MemoryService`. | Wiring. |

**Relationships:**
- **Written by** `evaluation/evaluation.worker.ts` — after each objective evaluation it stores an
  outcome/lesson for the assigned employee.
- **Read by** `workers/execution.worker.ts` — `recallBlock()` is appended to the run's CLAUDE.md
  (`systemPromptAppend`), so the employee starts each run remembering its relevant past outcomes.
