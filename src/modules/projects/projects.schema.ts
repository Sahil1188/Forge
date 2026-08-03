import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { companies } from '../companies/companies.schema';
import { goals } from '../goals/goals.schema';

export type ProjectStatus = 'active' | 'completed' | 'cancelled';

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  goalId: uuid('goal_id')
    .notNull()
    .references(() => goals.id),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id),
  name: text('name').notNull(),
  status: text('status').$type<ProjectStatus>().notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Project = typeof projects.$inferSelect;
