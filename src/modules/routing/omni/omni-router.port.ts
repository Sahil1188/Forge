import type { EmployeeWithRelations } from '../../employees/employees.schema';

export interface ModelSelection {
  runtimeKey: string;
  provider: string;
  model: string;
}

/**
 * Answers "WHAT intelligence/runtime should execute the work?" (spec §8).
 * V1 is a trivial static policy lookup; the interface lets a cost/quality/
 * complexity-weighted router replace it later without changing callers.
 */
export interface OmniRouterPort {
  selectModel(
    workItem: { taskType: string; priority?: number },
    employee: EmployeeWithRelations,
  ): ModelSelection;
}

export const OMNI_ROUTER = Symbol('OMNI_ROUTER');
