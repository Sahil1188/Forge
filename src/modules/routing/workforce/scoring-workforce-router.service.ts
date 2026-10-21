import { Injectable, Logger } from '@nestjs/common';
import { EmployeesService } from '../../employees/employees.service';
import { ReputationService } from '../../performance/reputation.service';
import { RuntimeAvailability } from '../../runtimes/runtime-availability';
import {
  WorkforceRouterPort,
  WorkforceRoutingDecision,
  WorkforceRoutingTarget,
} from './workforce-router.port';
import { CandidateInput, executionPool, selectBest } from './candidate-scoring';

/**
 * V1 Workforce Router: scores same-company employees on skill+role+availability
 * (reputation wired but weight 0). Only employees whose runtime can actually run are
 * considered, and executives are used for execution only when nobody else is available.
 */
@Injectable()
export class ScoringWorkforceRouter implements WorkforceRouterPort {
  private readonly logger = new Logger(ScoringWorkforceRouter.name);

  constructor(
    private readonly employees: EmployeesService,
    private readonly reputation: ReputationService,
    private readonly runtimes: RuntimeAvailability,
  ) {}

  async route(target: WorkforceRoutingTarget): Promise<WorkforceRoutingDecision | null> {
    const roster = await this.employees.findByCompany(target.companyId);
    const candidates: CandidateInput[] = [];

    for (const base of roster) {
      const full = await this.employees.findOne(base.id);
      const rc = full.runtimeConfig;
      const availability = await this.runtimes.check(rc?.runtimeKey ?? 'claude_code', rc?.provider);
      if (!availability.available) {
        this.logger.debug(`Skipping ${base.name}: ${availability.reason}`);
        continue;
      }
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

    return selectBest(target.taskType, executionPool(candidates));
  }
}
