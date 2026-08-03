import { pgTable, uuid, text, integer, doublePrecision, timestamp } from 'drizzle-orm/pg-core';
import { employees } from '../employees/employees.schema';
import { agentRuns } from '../runtimes/agent-runs.schema';

export type BudgetPeriod = 'day' | 'total';

export const budgets = pgTable('budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id')
    .notNull()
    .unique()
    .references(() => employees.id),
  period: text('period').$type<BudgetPeriod>().notNull().default('day'),
  softLimitUsd: doublePrecision('soft_limit_usd'),
  hardLimitUsd: doublePrecision('hard_limit_usd'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/** Granular cost ledger — the source of truth for budget enforcement (spec §21). */
export const costEvents = pgTable('cost_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentRunId: uuid('agent_run_id').references(() => agentRuns.id),
  employeeId: uuid('employee_id')
    .notNull()
    .references(() => employees.id),
  inputTokens: integer('input_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
  costUsd: doublePrecision('cost_usd').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Budget = typeof budgets.$inferSelect;
export type CostEvent = typeof costEvents.$inferSelect;
