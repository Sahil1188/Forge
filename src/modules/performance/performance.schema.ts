import {
  pgTable,
  uuid,
  text,
  integer,
  doublePrecision,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core';
import { employees } from '../employees/employees.schema';
import { workItems } from '../work/work.schema';

/**
 * Raw performance measurements per completed work item (spec §13). We store
 * measurements only — reputation/ranking is computed on read, never stored, so
 * the formula can change without a migration.
 */
export const performanceRecords = pgTable('performance_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id')
    .notNull()
    .references(() => employees.id),
  workItemId: uuid('work_item_id').references(() => workItems.id),
  taskType: text('task_type').notNull(),
  qualityScore: integer('quality_score'),
  correctnessScore: integer('correctness_score'),
  reliabilityScore: integer('reliability_score'),
  testsScore: integer('tests_score'),
  securityScore: integer('security_score'),
  evaluationScore: integer('evaluation_score'),
  costUsd: doublePrecision('cost_usd'),
  durationMs: integer('duration_ms'),
  humanApproval: boolean('human_approval').notNull().default(false),
  retries: integer('retries').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type PerformanceRecord = typeof performanceRecords.$inferSelect;
