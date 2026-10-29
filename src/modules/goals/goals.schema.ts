import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { companies, users } from '../companies/companies.schema';

export type GoalStatus = 'draft' | 'active' | 'completed' | 'cancelled';

/** `plan`: the CEO breaks the goal down. `direct`: one work item straight to the best employee. */
export type GoalMode = 'plan' | 'direct';

export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').$type<GoalStatus>().notNull().default('draft'),
  mode: text('mode').$type<GoalMode>().notNull().default('plan'),
  /** Commands that must exit 0 once the goal is delivered (checked on its final work item). */
  acceptance: jsonb('acceptance_json').$type<string[]>().notNull().default([]),
  /** Exact folder for this goal's project, when the operator chose one. */
  location: text('location'),
  /** Brand (brands/<slug>.md) this goal's UI follows; set by the user, the company default or the planner. */
  brand: text('brand'),
  createdByUserId: uuid('created_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Goal = typeof goals.$inferSelect;
