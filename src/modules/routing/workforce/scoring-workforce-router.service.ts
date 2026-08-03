import { Injectable } from '@nestjs/common';
import { EmployeesService } from '../../employees/employees.service';
import { ReputationService } from '../../performance/reputation.service';
import {
  WorkforceRouterPort,
  WorkforceRoutingDecision,
  WorkforceRoutingTarget,
} from './workforce-router.port';
import { CandidateInput, selectBest } from './candidate-scoring';

/**
 * V1 Workforce Router: scores same-company employees on skill+role+availability
 * (reputation wired but weight 0). Fetches per-candidate skills and reputation,
 * then delegates to the pure scorer.
 */
@Injectable()
export class ScoringWorkforceRouter implements WorkforceRouterPort {
  constructor(
    private readonly employees: EmployeesService,
    private readonly reputation: ReputationService,
  ) {}

  async route(target: WorkforceRoutingTarget): Promise<WorkforceRoutingDecision | null> {
    const roster = await this.employees.findByCompany(target.companyId);
    const candidates: CandidateInput[] = [];

    for (const base of roster) {
      const full = await this.employees.findOne(base.id);
      const reputation = await this.reputation.compute(base.id);
      candidates.push({
        id: base.id,
        role: base.role,
        department: base.department,
        status: base.status,
        skills: full.skills.map((s) => ({ skillKey: s.skillKey, level: s.level })),
        reputation: reputation.overall,
      });
    }

    return selectBest(target.taskType, candidates);
  }
}
