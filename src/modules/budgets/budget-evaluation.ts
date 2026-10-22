export type BudgetState = 'ok' | 'soft_exceeded' | 'hard_exceeded';

export interface BudgetEvaluation {
  state: BudgetState;
  spend: number;
  period?: 'day' | 'total';
  softLimit?: number | null;
  hardLimit?: number | null;
}

/**
 * Pure budget decision (spec §21): hard limit takes precedence over soft.
 * `null`/undefined limits are treated as "no limit".
 */
export function evaluateBudget(
  spend: number,
  softLimit?: number | null,
  hardLimit?: number | null,
): BudgetState {
  if (hardLimit != null && spend >= hardLimit) {
    return 'hard_exceeded';
  }
  if (softLimit != null && spend >= softLimit) {
    return 'soft_exceeded';
  }
  return 'ok';
}
