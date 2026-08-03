import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gte, sql } from 'drizzle-orm';
import { DRIZZLE, Database } from '../../infrastructure/database/drizzle.provider';
import { budgets, costEvents, Budget, BudgetPeriod } from './budgets.schema';
import { BudgetEvaluation, evaluateBudget } from './budget-evaluation';

export interface SetBudgetInput {
  period?: BudgetPeriod;
  softLimitUsd?: number | null;
  hardLimitUsd?: number | null;
}

export interface RecordCostInput {
  inputTokens?: number;
  outputTokens?: number;
  costUsd: number;
}

@Injectable()
export class BudgetsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async setBudget(employeeId: string, input: SetBudgetInput): Promise<Budget> {
    const [row] = await this.db
      .insert(budgets)
      .values({
        employeeId,
        period: input.period ?? 'day',
        softLimitUsd: input.softLimitUsd ?? null,
        hardLimitUsd: input.hardLimitUsd ?? null,
      })
      .onConflictDoUpdate({
        target: budgets.employeeId,
        set: {
          period: input.period ?? 'day',
          softLimitUsd: input.softLimitUsd ?? null,
          hardLimitUsd: input.hardLimitUsd ?? null,
        },
      })
      .returning();
    return row;
  }

  async getBudget(employeeId: string): Promise<Budget | undefined> {
    const [row] = await this.db.select().from(budgets).where(eq(budgets.employeeId, employeeId));
    return row;
  }

  async recordCost(
    agentRunId: string | null,
    employeeId: string,
    input: RecordCostInput,
  ): Promise<void> {
    await this.db.insert(costEvents).values({
      agentRunId,
      employeeId,
      inputTokens: input.inputTokens ?? 0,
      outputTokens: input.outputTokens ?? 0,
      costUsd: input.costUsd,
    });
  }

  async spend(employeeId: string, period: BudgetPeriod): Promise<number> {
    const since = period === 'day' ? startOfToday() : new Date(0);
    const [row] = await this.db
      .select({ total: sql<number>`coalesce(sum(${costEvents.costUsd}), 0)` })
      .from(costEvents)
      .where(and(eq(costEvents.employeeId, employeeId), gte(costEvents.createdAt, since)));
    return Number(row?.total ?? 0);
  }

  /** Current budget state for an employee; unlimited (ok) when no budget is set. */
  async check(employeeId: string): Promise<BudgetEvaluation> {
    const budget = await this.getBudget(employeeId);
    if (!budget) {
      return { state: 'ok', spend: 0 };
    }
    const spend = await this.spend(employeeId, budget.period);
    return {
      state: evaluateBudget(spend, budget.softLimitUsd, budget.hardLimitUsd),
      spend,
      softLimit: budget.softLimitUsd,
      hardLimit: budget.hardLimitUsd,
    };
  }
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
