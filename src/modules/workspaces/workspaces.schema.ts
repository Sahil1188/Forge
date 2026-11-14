import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { employees } from '../employees/employees.schema';
import { workItems } from '../work/work.schema';
import { goals } from '../goals/goals.schema';

/** Isolated execution workspace for a single agent run (spec §10/§11). */
export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id')
    .notNull()
    .references(() => employees.id),
  // Either a work-item workspace or a goal-level (planning) workspace.
  workItemId: uuid('work_item_id').references(() => workItems.id),
  goalId: uuid('goal_id').references(() => goals.id),
  kind: text('kind').notNull().default('local_worktree'),
  rootPath: text('root_path').notNull(),
  gitBranch: text('git_branch'),
  baseRef: text('base_ref'),
  status: text('status').notNull().default('ready'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Workspace = typeof workspaces.$inferSelect;
