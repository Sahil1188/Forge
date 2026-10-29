import { pgTable, uuid, text, timestamp, doublePrecision, index } from 'drizzle-orm/pg-core';
import { companies } from '../companies/companies.schema';
import { goals } from '../goals/goals.schema';

/**
 * The "Ask Forge" conversation: questions people ask about a company or one goal, and the answers.
 * A null goal means a question about the whole company.
 */
export const askMessages = pgTable(
  'ask_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    goalId: uuid('goal_id').references(() => goals.id),
    role: text('role').$type<'user' | 'assistant'>().notNull(),
    content: text('content').notNull(),
    costUsd: doublePrecision('cost_usd').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('ask_messages_company_goal').on(t.companyId, t.goalId, t.createdAt)],
);

export type AskMessage = typeof askMessages.$inferSelect;
