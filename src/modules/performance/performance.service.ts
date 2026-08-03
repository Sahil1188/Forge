import { Inject, Injectable } from '@nestjs/common';
import { asc, desc, eq } from 'drizzle-orm';
import { DRIZZLE, Database } from '../../infrastructure/database/drizzle.provider';
import { performanceRecords, PerformanceRecord } from './performance.schema';
import { EvaluationResult, DimensionResult } from '../evaluation/evaluation-engine';
import { AgentRun } from '../runtimes/agent-runs.schema';

export interface RecordFromEvaluationInput {
  employeeId: string;
  workItemId: string;
  taskType: string;
  result: EvaluationResult;
  run?: AgentRun;
  retries?: number;
  humanApproval?: boolean;
}

@Injectable()
export class PerformanceService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  /** Derives measurements from an evaluation + run and stores them (spec §13). */
  async recordFromEvaluation(input: RecordFromEvaluationInput): Promise<PerformanceRecord> {
    const overall = input.result.overallScore ?? 0;
    const testDim: DimensionResult | undefined = input.result.dimensions.test;
    const reliability = input.run?.status === 'completed' ? 100 : 0;

    const [row] = await this.db
      .insert(performanceRecords)
      .values({
        employeeId: input.employeeId,
        workItemId: input.workItemId,
        taskType: input.taskType,
        qualityScore: overall,
        correctnessScore: testDim?.score ?? overall,
        reliabilityScore: reliability,
        testsScore: testDim?.score ?? null,
        securityScore: null,
        evaluationScore: overall,
        costUsd: input.run?.estimatedCostUsd ?? null,
        durationMs: input.run?.durationMs ?? null,
        humanApproval: input.humanApproval ?? false,
        retries: input.retries ?? 0,
      })
      .returning();
    return row;
  }

  /** Ordered oldest→newest (reputation weights recency). */
  async findByEmployee(employeeId: string): Promise<PerformanceRecord[]> {
    return this.db
      .select()
      .from(performanceRecords)
      .where(eq(performanceRecords.employeeId, employeeId))
      .orderBy(asc(performanceRecords.createdAt));
  }

  async findRecent(employeeId: string, limit = 10): Promise<PerformanceRecord[]> {
    return this.db
      .select()
      .from(performanceRecords)
      .where(eq(performanceRecords.employeeId, employeeId))
      .orderBy(desc(performanceRecords.createdAt))
      .limit(limit);
  }
}
