import { pgTable, uuid, text, jsonb, boolean, timestamp } from 'drizzle-orm/pg-core';
import { agentRuns } from '../runtimes/agent-runs.schema';
import { workItems } from '../work/work.schema';
import { employees } from '../employees/employees.schema';
import { users } from '../companies/companies.schema';

export type ApprovalStatus = 'pending' | 'approved' | 'denied';

/** Human-in-the-loop approval for a gated tool call (spec §20). */
export const approvals = pgTable('approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentRunId: uuid('agent_run_id')
    .notNull()
    .references(() => agentRuns.id),
  workItemId: uuid('work_item_id')
    .notNull()
    .references(() => workItems.id),
  employeeId: uuid('employee_id')
    .notNull()
    .references(() => employees.id),
  toolName: text('tool_name').notNull(),
  requestedAction: jsonb('requested_action_json')
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  status: text('status').$type<ApprovalStatus>().notNull().default('pending'),
  consumed: boolean('consumed').notNull().default(false),
  decidedByUserId: uuid('decided_by_user_id').references(() => users.id),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Approval = typeof approvals.$inferSelect;
