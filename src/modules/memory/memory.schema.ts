import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { employees } from '../employees/employees.schema';

/**
 * Long-term agent memory (spec §15). Distinct from the *episodic* record (agent
 * runs / transcripts, which say what happened): these are the durable, retrievable
 * lessons and facts an employee carries into future runs. Written objectively from
 * evaluation outcomes — never self-narrated by the model — and injected into the
 * next run's context by the Omni/execution path.
 */
export type MemoryKind = 'outcome' | 'lesson' | 'preference' | 'fact';

export const agentMemories = pgTable(
  'agent_memories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    kind: text('kind').$type<MemoryKind>().notNull().default('outcome'),
    /** The task-type this memory is most relevant to (for scoped recall). */
    taskType: text('task_type'),
    /** The specific skill this memory touches, when applicable. */
    skillKey: text('skill_key'),
    content: text('content').notNull(),
    /** 0–100: how strongly to surface this memory. Failures rank high (learn from them). */
    salience: integer('salience_int').notNull().default(50),
    sourceRunId: uuid('source_run_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byEmployee: index('agent_memories_employee_idx').on(t.employeeId),
  }),
);

export type AgentMemory = typeof agentMemories.$inferSelect;
