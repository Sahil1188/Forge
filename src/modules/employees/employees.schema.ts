import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { companies } from '../companies/companies.schema';
import type { BriefContent } from './employee-briefs';

/** Model routing policy stored per runtime config (consumed by the Omni Router). */
export interface ModelPolicy {
  default?: string;
  byTaskType?: Record<string, string>;
  /** Complexity-tiered selection: strong model for hard work, cheap for simple. */
  byComplexity?: { high: string; low: string };
  complexityThreshold?: number;
}

export const employeeRuntimeConfigs = pgTable('employee_runtime_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  runtimeKey: text('runtime_key').notNull().default('claude_code'),
  provider: text('provider').notNull().default('anthropic'),
  modelPolicy: jsonb('model_policy_json').$type<ModelPolicy>().notNull().default({}),
  settings: jsonb('settings_json').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Employee status lifecycle (kept as text to avoid enum migrations early). */
export type EmployeeStatus = 'idle' | 'working' | 'paused_for_approval' | 'error';

export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id),
  name: text('name').notNull(),
  role: text('role').notNull(),
  description: text('description'),
  department: text('department'),
  // Self-referencing reporting line (manager).
  managerEmployeeId: uuid('manager_employee_id').references((): AnyPgColumn => employees.id),
  runtimeConfigId: uuid('runtime_config_id').references(() => employeeRuntimeConfigs.id),
  status: text('status').$type<EmployeeStatus>().notNull().default('idle'),
  autonomy: jsonb('autonomy_json').$type<Record<string, unknown>>().notNull().default({}),
  governance: jsonb('governance_json').$type<Record<string, unknown>>().notNull().default({}),
  /** A brief edited in the console; null means the built-in brief for the name or role applies. */
  brief: jsonb('brief_json').$type<BriefContent | null>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const employeeSkills = pgTable('employee_skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id')
    .notNull()
    .references(() => employees.id, { onDelete: 'cascade' }),
  skillKey: text('skill_key').notNull(),
  level: integer('level_int').notNull().default(0),
  source: text('source').notNull().default('seed'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type EmployeeRuntimeConfig = typeof employeeRuntimeConfigs.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type EmployeeSkill = typeof employeeSkills.$inferSelect;

export interface EmployeeWithRelations extends Employee {
  skills: EmployeeSkill[];
  runtimeConfig: EmployeeRuntimeConfig | null;
}
