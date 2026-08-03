import { Injectable } from '@nestjs/common';
import { CompaniesService } from '../companies/companies.service';
import { EmployeesService } from '../employees/employees.service';
import { AgentRunsService } from '../runtimes/agent-runs.service';
import { AgentRun } from '../runtimes/agent-runs.schema';

function summarizeRun(run: AgentRun) {
  return {
    id: run.id,
    status: run.status,
    runtimeKey: run.runtimeKey,
    model: run.model,
    workItemId: run.workItemId,
    goalId: run.goalId,
    durationMs: run.durationMs,
    toolCallCount: run.toolCallCount,
    filesChangedCount: run.filesChangedCount,
    estimatedCostUsd: run.estimatedCostUsd,
    startedAt: run.startedAt,
    endedAt: run.endedAt,
  };
}

/** Read-side views for the console/status UI (spec §23). */
@Injectable()
export class ObservabilityService {
  constructor(
    private readonly companies: CompaniesService,
    private readonly employees: EmployeesService,
    private readonly agentRuns: AgentRunsService,
  ) {}

  async companyOverview(companyId: string) {
    const company = await this.companies.findOne(companyId);
    const roster = await this.employees.findByCompany(companyId);

    const employees = [];
    for (const base of roster) {
      const full = await this.employees.findOne(base.id);
      const runs = await this.agentRuns.findByEmployee(base.id, 1);
      employees.push({
        id: base.id,
        name: base.name,
        role: base.role,
        department: base.department,
        status: base.status,
        managerEmployeeId: base.managerEmployeeId,
        defaultModel: full.runtimeConfig?.modelPolicy?.default ?? null,
        runtimeKey: full.runtimeConfig?.runtimeKey ?? null,
        latestRun: runs[0] ? summarizeRun(runs[0]) : null,
      });
    }

    return { company, employees };
  }

  async workItemRuns(workItemId: string) {
    const runs = await this.agentRuns.findByWorkItem(workItemId);
    return runs.map(summarizeRun);
  }

  async run(id: string) {
    return this.agentRuns.findOne(id);
  }
}
