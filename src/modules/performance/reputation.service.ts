import { Injectable } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { PerformanceRecord } from './performance.schema';
import { computeReputation } from './reputation-math';

export interface ReputationView {
  overall: number | null;
  samples: number;
  byTaskType: Record<string, number | null>;
}

/**
 * Computed read-model over performance_records (spec §13) — no stored rank, so
 * the weighting can evolve (recency, task-type) without a schema change.
 */
@Injectable()
export class ReputationService {
  constructor(private readonly performance: PerformanceService) {}

  async compute(employeeId: string): Promise<ReputationView> {
    const records = await this.performance.findByEmployee(employeeId);
    const scores = evaluationScores(records);

    const byTaskType: Record<string, number | null> = {};
    for (const [taskType, group] of groupByTaskType(records)) {
      byTaskType[taskType] = computeReputation(evaluationScores(group));
    }

    return { overall: computeReputation(scores), samples: scores.length, byTaskType };
  }
}

export function evaluationScores(records: PerformanceRecord[]): number[] {
  return records
    .map((r) => r.evaluationScore)
    .filter((s): s is number => typeof s === 'number');
}

export function groupByTaskType(records: PerformanceRecord[]): Map<string, PerformanceRecord[]> {
  const groups = new Map<string, PerformanceRecord[]>();
  for (const record of records) {
    const list = groups.get(record.taskType) ?? [];
    list.push(record);
    groups.set(record.taskType, list);
  }
  return groups;
}
