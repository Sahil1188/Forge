import { pgTable, uuid, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { workItems } from '../work/work.schema';
import { agentRuns } from '../runtimes/agent-runs.schema';

export type EvaluationStatus = 'passed' | 'failed' | 'inconclusive';

/** Objective verification of completed work (spec §12) — never self-reported. */
export const evaluations = pgTable('evaluations', {
  id: uuid('id').primaryKey().defaultRandom(),
  workItemId: uuid('work_item_id')
    .notNull()
    .references(() => workItems.id),
  agentRunId: uuid('agent_run_id').references(() => agentRuns.id),
  status: text('status').$type<EvaluationStatus>().notNull(),
  overallScore: integer('overall_score'),
  detail: jsonb('detail_json').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Evaluation = typeof evaluations.$inferSelect;
