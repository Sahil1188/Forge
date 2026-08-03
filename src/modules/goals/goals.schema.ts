import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { companies, users } from '../companies/companies.schema';

export type GoalStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').$type<GoalStatus>().notNull().default('draft'),
  createdByUserId: uuid('created_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Goal = typeof goals.$inferSelect;
