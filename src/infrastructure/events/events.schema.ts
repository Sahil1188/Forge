import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

/**
 * Transactional outbox. Domain writes insert an unpublished row in the same
 * transaction as the aggregate change; the dispatcher later publishes it to the
 * in-process EventBus and stamps `published_at`.
 */
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  aggregateType: text('aggregate_type').notNull(),
  aggregateId: uuid('aggregate_id').notNull(),
  type: text('type').notNull(),
  payload: jsonb('payload_json').$type<Record<string, unknown>>().notNull().default({}),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type EventRow = typeof events.$inferSelect;
