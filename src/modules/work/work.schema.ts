import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  unique,
} from 'drizzle-orm/pg-core';
import { companies } from '../companies/companies.schema';
import { employees } from '../employees/employees.schema';
import { projects } from '../projects/projects.schema';
import type { WorkItemStatus } from './work-status';

/** Task type drives the Omni Router's model selection (spec §8). */
export type TaskType = 'architecture' | 'coding' | 'review' | 'devops' | 'qa' | 'generic';

export const workItems = pgTable('work_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id),
  title: text('title').notNull(),
  description: text('description'),
  taskType: text('task_type').$type<TaskType>().notNull().default('generic'),
  status: text('status').$type<WorkItemStatus>().notNull().default('created'),
  priority: integer('priority_int').notNull().default(0),
  assignedEmployeeId: uuid('assigned_employee_id').references(() => employees.id),
  artifacts: jsonb('artifacts_json').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const workDependencies = pgTable(
  'work_dependencies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workItemId: uuid('work_item_id')
      .notNull()
      .references(() => workItems.id, { onDelete: 'cascade' }),
    dependsOnWorkItemId: uuid('depends_on_work_item_id')
      .notNull()
      .references(() => workItems.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueEdge: unique('work_dependencies_edge_unique').on(t.workItemId, t.dependsOnWorkItemId),
  }),
);

export const workAssignments = pgTable('work_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  workItemId: uuid('work_item_id')
    .notNull()
    .references(() => workItems.id, { onDelete: 'cascade' }),
  employeeId: uuid('employee_id')
    .notNull()
    .references(() => employees.id),
  assignedBy: text('assigned_by'),
  reason: jsonb('reason_json').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type WorkItem = typeof workItems.$inferSelect;
export type WorkDependency = typeof workDependencies.$inferSelect;
export type WorkAssignment = typeof workAssignments.$inferSelect;

export interface WorkItemWithRelations extends WorkItem {
  dependencies: WorkDependency[];
}
