import { Inject, Injectable, Logger, OnModuleInit, OnApplicationBootstrap } from '@nestjs/common';
import { countAttempts } from '../runtimes/attempts';
import { asc, eq, inArray } from 'drizzle-orm';
import { OutboxService } from '../../infrastructure/events/outbox.service';
import { WORKSPACE_PORT, WorkspacePort } from '../workspaces/workspace.port';
import { projects } from '../projects/projects.schema';
import { goals } from '../goals/goals.schema';
import { DRIZZLE, Database } from '../../infrastructure/database/drizzle.provider';
import { EventBus } from '../../infrastructure/events/event-bus';
import { EventTypes } from '../../infrastructure/events/event-types';
import { workItems, WorkItem } from '../work/work.schema';
import { workspaces } from '../workspaces/workspaces.schema';
import { WorkService } from '../work/work.service';
import { AgentRunsService } from '../runtimes/agent-runs.service';
import { EvaluationEngine, EvaluationResult } from './evaluation-engine';
import { VisualGate } from './visual/visual-gate';
import { EvaluationsService } from './evaluations.service';
import { Evaluation } from './evaluation.schema';
import { PerformanceService } from '../performance/performance.service';
import { SkillProgressionService } from '../performance/skill-progression.service';
import { complexityOf } from '../performance/skill-math';
import { MemoryService } from '../memory/memory.service';

/** Raised when an item is not (or no longer) in `evaluating` — e.g. a replayed event. */
export class NotAwaitingEvaluationError extends Error {
  constructor(
    readonly workItemId: string,
    readonly status: string,
  ) {
    super(`Work item ${workItemId} is ${status}, not awaiting evaluation`);
    this.name = 'NotAwaitingEvaluationError';
  }
}

export interface EvaluationSummary {
  evaluationId: string;
  workItemId: string;
  status: Evaluation['status'];
  overallScore: number | null;
  routedTo: 'done' | 'rework';
  /** Set when the item passed but its branch could not be merged into the project. */
  integrationConflict?: string;
}

const DEFAULT_MAX_ATTEMPTS = 3;

/**
 * Evaluates work items that have reached `evaluating`: discovers and runs the
 * repo's real build/test/lint, records a scored evaluation, and routes the item
 * to `done` (pass/inconclusive) or `rework` (fail) — spec §12.
 */
@Injectable()
export class EvaluationWorker implements OnModuleInit, OnApplicationBootstrap {
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
    private readonly memory: MemoryService,
    @Inject(WORKSPACE_PORT) private readonly workspace: WorkspacePort,
    private readonly outbox: OutboxService,
    private readonly visual: VisualGate,
  ) {}

  /**
   * UI work must also look right: frontend, design and final-review steps that passed their checks
   * go through the visual gate (run the app, screenshot it, design review). Failing it fails the item.
   */
  private async withVisualGate(item: WorkItem, rootPath: string, result: EvaluationResult): Promise<EvaluationResult> {
    if (result.status === 'failed' || !['frontend', 'design', 'review'].includes(item.taskType)) return result;
    const [project] = await this.db.select({ goalId: projects.goalId }).from(projects).where(eq(projects.id, item.projectId));
    if (!project) return result;
    const visual = await this.visual.check(rootPath, { companyId: item.companyId, goalId: project.goalId, title: item.title });
    if (!visual) return result;
    const dimensions = { ...result.dimensions, visual };
    const scores = Object.values(dimensions).map((d) => d.score);
    return {
      ...result,
      status: visual.exitCode === 0 ? (result.status === 'inconclusive' ? 'passed' : result.status) : 'failed',
      overallScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      dimensions,
    };
  }

  onModuleInit(): void {
    // Prod trigger: when a work item enters `evaluating`, evaluate it. Tests call
    // evaluate()/runOnce() directly, so skip the subscriber under the runner to
    // avoid firing on artificial transitions / pool teardown.
    if (process.env.VITEST || process.env.FORGE_MANUAL_DRIVE) {
      return;
    }
    this.enableAutoRun();
  }

  /**
   * Checks that were running when Forge stopped would leave their item "evaluating" forever (nothing
   * re-triggers them). Re-run them on start: checks are plain commands, so re-running loses nothing,
   * and it makes a restart during checking safe.
   */
  onApplicationBootstrap(): void {
    if (process.env.VITEST || process.env.FORGE_MANUAL_DRIVE) return;
    void this.resumeInterrupted().catch((err) => this.logger.error(`Resuming interrupted checks failed: ${(err as Error).message}`));
  }

  async resumeInterrupted(): Promise<number> {
    const stuck = await this.db.select({ id: workItems.id }).from(workItems).where(eq(workItems.status, 'evaluating'));
    for (const { id } of stuck) {
      this.logger.log(`Re-running interrupted checks for work item ${id}`);
      try {
        const r = await this.evaluate(id);
        if (r.routedTo === 'rework') await this.retryOrFail(r.workItemId);
      } catch (err) {
        if (!(err instanceof NotAwaitingEvaluationError)) this.logger.warn(`Checks for ${id} failed to run: ${(err as Error).message}`);
      }
    }
    return stuck.length;
  }

  private autoRun = false;

  /** Prod auto-chain (also callable from tests): evaluate on `evaluating`, retry on rework. */
  enableAutoRun(): void {
    if (this.autoRun) return;
    this.autoRun = true;
    this.bus.subscribe(EventTypes.WorkStatusChanged, (event) => {
      if ((event.payload as { to?: string }).to === 'evaluating') {
        void this.evaluate(event.aggregateId)
          .then((r) => (r.routedTo === 'rework' ? this.retryOrFail(r.workItemId) : undefined))
          .catch((err) => {
            // A replayed/stale event for an item that already moved on is expected, not an error.
            if (err instanceof NotAwaitingEvaluationError) return;
            this.logger.error(`Auto-evaluation failed: ${(err as Error).message}`);
          });
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
    // Only work that is actually awaiting evaluation may be scored. Anything else would
    // run the toolchain, store a stray evaluation row, and then fail the transition.
    if (item.status !== 'evaluating') {
      throw new NotAwaitingEvaluationError(item.id, item.status);
    }
    const rootPath = await this.resolveWorkspacePath(item);

    const result = await this.withVisualGate(item, rootPath, await this.engine.evaluateRepo(rootPath, item.acceptance ?? []));
    const runs = await this.agentRuns.findByWorkItem(item.id);
    const evaluation = await this.evaluations.create({
      workItemId: item.id,
      agentRunId: runs[0]?.id ?? null,
      result,
    });

    let routedTo: 'done' | 'rework' = result.status === 'failed' ? 'rework' : 'done';
    let integrationConflict: string | undefined;
    if (routedTo === 'done') {
      // Passing work becomes part of the project's deliverable (`main`), so the next item
      // starts from it. A merge that doesn't apply cleanly sends the item back for rework.
      const branch = (item.artifacts as { branch?: string } | null)?.branch;
      if (branch) {
        const merged = await this.workspace.integrate(item.projectId, branch);
        if (!merged.merged) {
          routedTo = 'rework';
          integrationConflict = merged.conflict;
          // Remembered so the retry starts from the latest main with this work merged in.
          await this.db
            .update(workItems)
            .set({ artifacts: { ...((item.artifacts as Record<string, unknown> | null) ?? {}), conflict: merged.conflict ?? 'merge conflict' } })
            .where(eq(workItems.id, item.id));
          this.logger.warn(`Work item ${item.id} passed but could not be merged: ${merged.conflict}`);
        } else if ((item.artifacts as { conflict?: string } | null)?.conflict) {
          const { conflict: _resolved, ...rest } = item.artifacts as Record<string, unknown>;
          await this.db.update(workItems).set({ artifacts: rest }).where(eq(workItems.id, item.id));
        }
      }
    }
    await this.work.changeStatus(item.id, { status: routedTo });
    if (routedTo === 'done') {
      await this.completeGoalIfFinished(item.projectId);
    }

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
      // Write a durable lesson so the employee carries this outcome into future
      // runs (spec §15). Failures are salient — you learn most from what broke.
      const passed = result.status !== 'failed';
      const failing = Object.entries(result.dimensions).filter(([, d]) => d.exitCode !== 0);
      const earlier = (await this.evaluations.findByWorkItem(item.id)).slice(1); // newest first; [0] is this one
      const lastFailure = earlier.find((e) => e.status === 'failed');
      const changed = ((item.artifacts as { filesChanged?: string[] } | null)?.filesChanged ?? []).slice(0, 8);
      let content: string;
      let salience: number;
      if (!passed) {
        // Specific: what broke and the evidence, so the same mistake is recognised next time.
        content = [`Mistake on "${item.title}" (${item.taskType}):`, ...failing.map(([name, d]) => `- ${name}: ${keyLines(d.output, name)}`)].join('\n');
        salience = 85;
      } else if (lastFailure) {
        // What fixed it: the most valuable kind of lesson.
        const was = Object.entries((lastFailure.detail as { dimensions?: Record<string, { exitCode?: number; output?: string }> }).dimensions ?? {})
          .filter(([, d]) => d.exitCode !== 0)
          .map(([name, d]) => `${name}: ${keyLines(d.output ?? '', name)}`)
          .join('; ');
        content = `Fixed "${item.title}" (${item.taskType}) after ${earlier.length + 1} attempts. The problem was — ${was}. The fix touched: ${changed.join(', ') || 'see the project history'}. Apply this up front next time.`;
        salience = 80;
      } else {
        content = `"${item.title}" (${item.taskType}) passed first time (score ${result.overallScore}). Files: ${changed.join(', ') || 'n/a'}.`;
        salience = 40;
      }
      await this.memory.remember({
        employeeId: item.assignedEmployeeId,
        kind: passed && !lastFailure ? 'outcome' : 'lesson',
        taskType: item.taskType,
        sourceRunId: runs[0]?.id ?? null,
        salience,
        content: content.slice(0, 1500),
      });
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
      integrationConflict,
    };
  }

  /**
   * After a failed evaluation: hand the item back to the same employee for another attempt
   * (their memory now carries the failure), up to FORGE_MAX_ATTEMPTS runs; then give up.
   * Driven by the auto-chain and the CLI, so the whole goal can finish unattended.
   */
  async retryOrFail(workItemId: string): Promise<'retried' | 'failed' | 'skipped'> {
    const item = await this.getWorkItem(workItemId);
    if (item.status !== 'rework' || !item.assignedEmployeeId) return 'skipped';
    // If the only failures are acceptance checks that cannot even run, retrying can't help:
    // stop and surface it, so a person fixes the check instead of the team burning attempts.
    const [latest] = await this.evaluations.findByWorkItem(item.id);
    const detail = (latest?.detail ?? {}) as { dimensions?: Record<string, { exitCode?: number }>; brokenChecks?: string[] };
    const failing = Object.entries(detail.dimensions ?? {}).filter(([, d]) => d.exitCode !== 0).map(([n]) => n);
    if (detail.brokenChecks?.length && failing.every((n) => detail.brokenChecks!.includes(n))) {
      await this.work.changeStatus(item.id, { status: 'failed' });
      this.logger.warn(`Work item ${item.id}: acceptance check(s) ${detail.brokenChecks.join(', ')} are invalid; not retrying`);
      return 'failed';
    }
    // Runs stopped by a usage limit are not attempts: the employee never got to finish.
    const { attempts } = countAttempts(await this.agentRuns.findByWorkItem(item.id));
    const max = Number(process.env.FORGE_MAX_ATTEMPTS ?? DEFAULT_MAX_ATTEMPTS);
    if (attempts < max) {
      await this.work.assign(item.id, { employeeId: item.assignedEmployeeId, assignedBy: 'auto_rework' });
      this.logger.log(`Work item ${item.id} failed evaluation; retry ${attempts + 1}/${max}`);
      return 'retried';
    }
    await this.work.changeStatus(item.id, { status: 'failed' });
    this.logger.warn(`Work item ${item.id} failed after ${attempts} attempt(s); giving up`);
    return 'failed';
  }

  /** Marks the goal completed once every (non-cancelled) item of its projects is done. */
  private async completeGoalIfFinished(projectId: string): Promise<void> {
    const [project] = await this.db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) return;
    const goalProjects = await this.db.select({ id: projects.id }).from(projects).where(eq(projects.goalId, project.goalId));
    const items = await this.db
      .select({ status: workItems.status })
      .from(workItems)
      .where(inArray(workItems.projectId, goalProjects.map((p) => p.id)));
    const live = items.filter((i) => i.status !== 'cancelled');
    if (live.length === 0 || live.some((i) => i.status !== 'done')) return;

    const [goal] = await this.db.select().from(goals).where(eq(goals.id, project.goalId));
    if (!goal || goal.status === 'completed' || goal.status === 'cancelled') return;
    await this.db.transaction(async (tx) => {
      await tx.update(goals).set({ status: 'completed' }).where(eq(goals.id, goal.id));
      await this.outbox.record(tx, {
        type: EventTypes.GoalCompleted,
        aggregateType: 'goal',
        aggregateId: goal.id,
        payload: { companyId: goal.companyId, items: live.length },
      });
    });
    this.logger.log(`Goal ${goal.id} completed (${live.length} work item(s) done)`);
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

/** The few lines of a check's output that say what actually went wrong. */
export function keyLines(output: string, name: string): string {
  const lines = String(output ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
  // Design review: its findings are the bullet lines.
  const findings = lines.filter((l) => /^- \[(critical|major|minor)\]/.test(l));
  if (name === 'visual' && findings.length) return findings.slice(0, 5).join(' | ');
  const signal = lines.filter((l) => /error|fail|expected|assert|not ok|cannot|undefined|exception|✗|×/i.test(l));
  return (signal.length ? signal : lines.slice(-3)).slice(0, 4).join(' | ').slice(0, 600);
}
