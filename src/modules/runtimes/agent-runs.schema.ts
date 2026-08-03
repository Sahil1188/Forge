import {
  pgTable,
  uuid,
  text,
  integer,
  doublePrecision,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';
import { employees } from '../employees/employees.schema';
import { workItems } from '../work/work.schema';
import { goals } from '../goals/goals.schema';
import { workspaces } from '../workspaces/workspaces.schema';

export type AgentRunStatus =
  | 'running'
  | 'completed'
  | 'failed'
  | 'needs_approval'
  | 'killed_budget'
  | 'killed_timeout'
  | 'killed_tools';

/** One execution of a runtime for a work item (spec §9.4/§23). */
export const agentRuns = pgTable('agent_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Either a work-item run (execution) or a goal-level run (CEO planning).
  workItemId: uuid('work_item_id').references(() => workItems.id),
  goalId: uuid('goal_id').references(() => goals.id),
  employeeId: uuid('employee_id')
    .notNull()
    .references(() => employees.id),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  runtimeKey: text('runtime_key').notNull(),
  provider: text('provider'),
  model: text('model'),
  status: text('status').$type<AgentRunStatus>().notNull().default('running'),
  sessionId: text('session_id'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  durationMs: integer('duration_ms'),
  inputTokens: integer('input_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
  estimatedCostUsd: doublePrecision('estimated_cost_usd').notNull().default(0),
  toolCallCount: integer('tool_call_count').notNull().default(0),
  filesChangedCount: integer('files_changed_count').notNull().default(0),
  transcriptRef: text('transcript_ref'),
  errorJson: jsonb('error_json').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type AgentRun = typeof agentRuns.$inferSelect;
