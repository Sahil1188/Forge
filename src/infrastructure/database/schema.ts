/**
 * Drizzle schema barrel.
 *
 * Each module owns its own table definitions; this barrel re-exports them so
 * `drizzle(client, { schema })` and `drizzle-kit` see every table from one import.
 */
export * from '../../modules/companies/companies.schema';
export * from '../../modules/employees/employees.schema';
export * from '../../modules/goals/goals.schema';
export * from '../../modules/projects/projects.schema';
export * from '../../modules/work/work.schema';
export * from '../../modules/workspaces/workspaces.schema';
export * from '../../modules/runtimes/agent-runs.schema';
export * from '../../modules/approvals/approvals.schema';
export * from '../../modules/budgets/budgets.schema';
export * from '../../modules/evaluation/evaluation.schema';
export * from '../../modules/performance/performance.schema';
export * from '../../modules/memory/memory.schema';
export * from '../../modules/heartbeats/heartbeats.schema';
export * from '../events/events.schema';
