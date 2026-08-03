import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { employees } from '../employees/employees.schema';
import { goals } from '../goals/goals.schema';

export type HeartbeatStatus = 'scheduled' | 'fired' | 'done' | 'failed';

/** A scheduled wake-up for an employee (spec §11) — V1 fires on goal start. */
export const heartbeats = pgTable('heartbeats', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id')
    .notNull()
    .references(() => employees.id),
  goalId: uuid('goal_id').references(() => goals.id),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull().defaultNow(),
  firedAt: timestamp('fired_at', { withTimezone: true }),
  status: text('status').$type<HeartbeatStatus>().notNull().default('scheduled'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Heartbeat = typeof heartbeats.$inferSelect;
