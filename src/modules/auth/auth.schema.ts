import { pgTable, uuid, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { companies, users } from '../companies/companies.schema';

/** What a person may do in one company. Ranked: viewer < member < admin < owner. */
export type Role = 'viewer' | 'member' | 'admin' | 'owner';
export const ROLES: Role[] = ['viewer', 'member', 'admin', 'owner'];

export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    role: text('role').$type<Role>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('memberships_company_user').on(t.companyId, t.userId)],
);

/** Browser sessions. Only a SHA-256 of the session token is stored. */
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Membership = typeof memberships.$inferSelect;
