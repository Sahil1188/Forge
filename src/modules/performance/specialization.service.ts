import { Injectable } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { computeReputation, mean } from './reputation-math';
import { evaluationScores, groupByTaskType } from './reputation.service';

export interface Specialization {
  taskType: string;
  reputation: number | null;
  samples: number;
}

const MIN_SAMPLES = 2;
const SPECIALIZATION_THRESHOLD = 80;

/**
 * Infers specialization from historical work patterns (spec §16) rather than a
 * manual label: task types with enough samples and a high average score.
 */
@Injectable()
export class SpecializationService {
  constructor(private readonly performance: PerformanceService) {}

  async infer(employeeId: string): Promise<Specialization[]> {
    const records = await this.performance.findByEmployee(employeeId);
    const specializations: Specialization[] = [];

    for (const [taskType, group] of groupByTaskType(records)) {
      const scores = evaluationScores(group);
      const avg = mean(scores);
      if (scores.length >= MIN_SAMPLES && avg !== null && avg >= SPECIALIZATION_THRESHOLD) {
        specializations.push({
          taskType,
          reputation: computeReputation(scores),
          samples: scores.length,
        });
      }
    }

    return specializations.sort((a, b) => (b.reputation ?? 0) - (a.reputation ?? 0));
  }
}
