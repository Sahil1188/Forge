export interface WorkforceRoutingTarget {
  id: string;
  companyId: string;
  taskType: string;
  /** People who must not get this work (e.g. the builder, for an independent review). */
  excludeEmployeeIds?: string[];
}

export interface WorkforceRoutingDecision {
  employeeId: string;
  score: number;
  reasons: Record<string, number>;
}

/**
 * Answers "WHO should perform this work?" (spec §7). A pluggable scoring engine,
 * not hardcoded rules — the V1 impl scores skill+role+availability, with
 * historical performance wired in but weighted 0 until there's data to trust.
 */
export interface WorkforceRouterPort {
  route(target: WorkforceRoutingTarget): Promise<WorkforceRoutingDecision | null>;
}

export const WORKFORCE_ROUTER = Symbol('WORKFORCE_ROUTER');
