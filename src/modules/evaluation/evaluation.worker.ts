import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DRIZZLE, Database } from '../../infrastructure/database/drizzle.provider';
import { EventBus } from '../../infrastructure/events/event-bus';
import { EventTypes } from '../../infrastructure/events/event-types';
import { workItems, WorkItem } from '../work/work.schema';
import { workspaces } from '../workspaces/workspaces.schema';
import { WorkService } from '../work/work.service';
import { AgentRunsService } from '../runtimes/agent-runs.service';
import { EvaluationEngine } from './evaluation-engine';
import { EvaluationsService } from './evaluations.service';
import { Evaluation } from './evaluation.schema';
import { PerformanceService } from '../performance/performance.service';
import { SkillProgressionService } from '../performance/skill-progression.service';
import { complexityOf } from '../performance/skill-math';

export interface EvaluationSummary {
  evaluationId: string;
  workItemId: string;
  status: Evaluation['status'];
  overallScore: number | null;
  routedTo: 'done' | 'rework';
}

/**
 * Evaluates work items that have reached `evaluating`: discovers and runs the
 * repo's real build/test/lint, records a scored evaluation, and routes the item
 * to `done` (pass/inconclusive) or `rework` (fail) — spec §12.
 */
@Injectable()
export class EvaluationWorker implements OnModuleInit {
  private readonly logger = new Logger(EvaluationWorker.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly bus: EventBus,
    private readonly engine: EvaluationEngine,
    private readonly evaluations: EvaluationsService,
    private readonly agentRuns: AgentRunsService,
    private readonly work: WorkService,
    private readonly performance: PerformanceService,
    private readonly skills: SkillProgressionService,
  ) {}

  onModuleInit(): void {
    // Prod trigger: when a work item enters `evaluating`, evaluate it. Tests call
    // evaluate()/runOnce() directly, so skip the subscriber under the runner to
    // avoid firing on artificial transitions / pool teardown.
    if (process.env.VITEST) {
      return;
    }
    this.bus.subscribe(EventTypes.WorkStatusChanged, (event) => {
      if ((event.payload as { to?: string }).to === 'evaluating') {
        void this.evaluate(event.aggregateId).catch((err) =>
          this.logger.error(`Auto-evaluation failed: ${(err as Error).message}`),
        );
      }
    });
  }

  /** Evaluates the next work item awaiting evaluation, or null if none. */
  async runOnce(): Promise<EvaluationSummary | null> {
    const [item] = await this.db
      .select()
      .from(workItems)
      .where(eq(workItems.status, 'evaluating'))
      .orderBy(asc(workItems.updatedAt))
      .limit(1);
    if (!item) return null;
    return this.evaluate(item.id);
  }

  async evaluate(workItemId: string): Promise<EvaluationSummary> {
    const item = await this.getWorkItem(workItemId);
    const rootPath = await this.resolveWorkspacePath(item);

    const result = await this.engine.evaluateRepo(rootPath);
    const runs = await this.agentRuns.findByWorkItem(item.id);
    const evaluation = await this.evaluations.create({
      workItemId: item.id,
      agentRunId: runs[0]?.id ?? null,
      result,
    });

    const routedTo: 'done' | 'rework' = result.status === 'failed' ? 'rework' : 'done';
    await this.work.changeStatus(item.id, { status: routedTo });

    // Performance + skill growth are driven strictly by the objective evaluation
    // (spec §13/§14) — never self-awarded. Skipped when inconclusive (no score).
    if (item.assignedEmployeeId && result.overallScore !== null) {
      await this.performance.recordFromEvaluation({
        employeeId: item.assignedEmployeeId,
        workItemId: item.id,
        taskType: item.taskType,
        result,
        run: runs[0],
        retries: Math.max(0, runs.length - 1),
      });
      await this.skills.applyGrowth(
        item.assignedEmployeeId,
        result.overallScore,
        complexityOf(item.taskType, item.priority),
      );
    }

    this.logger.log(
      `Evaluated work item ${item.id}: ${result.status} (score ${result.overallScore ?? 'n/a'}) -> ${routedTo}`,
    );

    return {
      evaluationId: evaluation.id,
      workItemId: item.id,
      status: result.status,
      overallScore: result.overallScore,
      routedTo,
    };
  }

  private async resolveWorkspacePath(item: WorkItem): Promise<string> {
    const runs = await this.agentRuns.findByWorkItem(item.id);
    const workspaceId = runs[0]?.workspaceId;
    if (!workspaceId) {
      throw new Error(`Work item ${item.id} has no workspace to evaluate`);
    }
    const [ws] = await this.db.select().from(workspaces).where(eq(workspaces.id, workspaceId));
    if (!ws) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }
    return ws.rootPath;
  }

  private async getWorkItem(id: string): Promise<WorkItem> {
    const [item] = await this.db.select().from(workItems).where(eq(workItems.id, id));
    if (!item) {
      throw new Error(`Work item ${id} not found`);
    }
    return item;
  }
}
