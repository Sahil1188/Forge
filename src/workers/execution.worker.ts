import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { and, asc, desc, eq, not, notInArray, sql } from 'drizzle-orm';
import { mkdir, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { DRIZZLE, Database } from '../infrastructure/database/drizzle.provider';
import { OutboxService } from '../infrastructure/events/outbox.service';
import { EventBus } from '../infrastructure/events/event-bus';
import { EventTypes } from '../infrastructure/events/event-types';
import { RuntimeRegistry } from '../modules/runtimes/runtime-registry';
import { AgentRunsService } from '../modules/runtimes/agent-runs.service';
import { AgentRun } from '../modules/runtimes/agent-runs.schema';
import { WORKSPACE_PORT, WorkspacePort, WorkspaceHandle } from '../modules/workspaces/workspace.port';
import { workspaces } from '../modules/workspaces/workspaces.schema';
import { EmployeesService } from '../modules/employees/employees.service';
import { EmployeeWithRelations } from '../modules/employees/employees.schema';
import { WorkService } from '../modules/work/work.service';
import { workItems, WorkItem } from '../modules/work/work.schema';
import { PermissionCallback, RuntimeEvent, RuntimeRunContext } from '../modules/runtimes/runtime.port';
import { GovernanceService } from '../modules/governance/governance.service';
import { findPathViolation } from '../modules/governance/path-confinement';
import { ApprovalsService } from '../modules/approvals/approvals.service';
import { BudgetsService } from '../modules/budgets/budgets.service';
import { redactSecrets } from '../modules/governance/redaction';
import { OMNI_ROUTER, OmniRouterPort } from '../modules/routing/omni/omni-router.port';
import { MemoryService } from '../modules/memory/memory.service';
import { UsageLimits, looksLikeUsageLimit } from '../modules/runtimes/usage-limits';
import { stopProcessesIn } from './process-cleanup';
import { standardsFor } from '../modules/work/standards';

export type ExecutionStatus =
  | 'completed'
  | 'failed'
  | 'paused'
  | 'blocked'
  | 'rate_limited'
  | 'killed_budget'
  | 'killed_timeout'
  | 'killed_tools';

export interface ExecutionSummary {
  agentRunId: string;
  workItemId: string;
  status: ExecutionStatus;
  model: string;
  runtimeKey: string;
  filesChanged: string[];
  estimatedCostUsd: number;
  approvalId?: string;
}

interface RunLimits {
  maxTurns: number;
  maxToolCalls: number;
  maxDurationMs: number;
}

type KillReason = 'budget' | 'timeout' | 'tools';
type KillStatus = 'killed_budget' | 'killed_timeout' | 'killed_tools';
const KILL_STATUS: Record<KillReason, KillStatus> = {
  budget: 'killed_budget',
  timeout: 'killed_timeout',
  tools: 'killed_tools',
};
const TIMEOUT = Symbol('timeout');
const CANCELLED = Symbol('cancelled');
const CANCEL_POLL_MS = Number(process.env.FORGE_CANCEL_POLL_MS ?? 3000);

// Real deliverables (installs, large generated files on Opus) need room; observed live: a workbook
// task was cut off at 10 minutes mid-write. FORGE_MAX_RUN_MINUTES overrides the default per run.
const DEFAULT_LIMITS: RunLimits = {
  maxTurns: 60,
  maxToolCalls: 120,
  maxDurationMs: Number(process.env.FORGE_MAX_RUN_MINUTES ?? 30) * 60 * 1000,
};
const DEFAULT_MAX_ATTEMPTS = 3;

/**
 * Executes assigned work items through the selected runtime with governance
 * gating (§20) and platform-enforced circuit breakers (§21): budget block/kill,
 * max duration, and max tool calls — all independent of the model's judgment.
 */
@Injectable()
export class ExecutionWorker implements OnModuleInit, OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(ExecutionWorker.name);
  private readonly transcriptDir = path.join(process.cwd(), 'workspaces', 'transcripts');
  private timer?: NodeJS.Timeout;
  private busy = false;

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(WORKSPACE_PORT) private readonly workspace: WorkspacePort,
    private readonly registry: RuntimeRegistry,
    private readonly agentRuns: AgentRunsService,
    private readonly employees: EmployeesService,
    private readonly work: WorkService,
    private readonly governance: GovernanceService,
    private readonly approvals: ApprovalsService,
    private readonly budgets: BudgetsService,
    private readonly outbox: OutboxService,
    private readonly bus: EventBus,
    @Inject(OMNI_ROUTER) private readonly omni: OmniRouterPort,
    private readonly memory: MemoryService,
    private readonly usageLimits: UsageLimits,
  ) {}

  onModuleInit(): void {
    // Cancelling a work item stops its running agent at once (always on, also under tests/CLI).
    this.bus.subscribe(EventTypes.WorkStatusChanged, (event) => {
      if ((event.payload as { to?: string }).to === 'cancelled') this.aborts.get(event.aggregateId)?.abort();
    });
    // Tests drive runOnce() directly; the CLI drives it in-process too. Skip prod
    // auto-triggers under the runner or when manual drive is requested.
    if (process.env.VITEST || process.env.FORGE_MANUAL_DRIVE) {
      return;
    }
    this.enableAutoRun();
    if (process.env.FORGE_EXECUTION_WORKER === '1') {
      this.timer = setInterval(() => this.kick(), 2000);
      this.timer.unref?.();
    }
  }

  private autoRun = false;

  /**
   * Prod auto-chain (also callable from tests): run work as soon as it becomes runnable.
   * That is when it is assigned, AND when some item reaches `done` — finishing work can
   * unblock dependents that were already assigned (observed live: a second item sat
   * `assigned` forever after the first one finished). Each trigger drains the whole queue.
   */
  enableAutoRun(): void {
    if (this.autoRun) return;
    this.autoRun = true;
    this.bus.subscribe(EventTypes.WorkAssigned, () => this.kick());
    this.bus.subscribe(EventTypes.WorkStatusChanged, (event) => {
      if ((event.payload as { to?: string }).to === 'done') this.kick();
    });
  }

  /** Resume anything left assigned from before this process started. */
  onApplicationBootstrap(): void {
    if (process.env.VITEST || process.env.FORGE_MANUAL_DRIVE) return;
    this.kick();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private kick(): void {
    void this.drain().catch((err) => this.logger.error(`Auto-run failed: ${(err as Error).message}`));
  }

  private wakeTimer?: NodeJS.Timeout;

  /** Re-drain the queue once a usage limit resets (one pending wake-up at a time). */
  private wakeAt(epochMs: number): void {
    if (this.wakeTimer || !this.autoRun) return;
    const delay = Math.max(1_000, Math.min(epochMs - Date.now() + 5_000, 6 * 3_600_000));
    this.logger.log(`Usage limit: holding work until ${new Date(epochMs).toISOString()}`);
    this.wakeTimer = setTimeout(() => {
      this.wakeTimer = undefined;
      this.kick();
    }, delay);
    this.wakeTimer.unref?.();
  }

  private draining?: Promise<ExecutionSummary[]>;
  private drainAgain = false;

  /**
   * Runs assigned work until the queue is empty. Safe to trigger repeatedly: a trigger that
   * arrives mid-drain is folded into the running drain (which re-checks the queue), so every
   * item runs exactly once. A blocked (over-budget) item stays queued but is skipped for the
   * rest of the drain, so it can neither loop forever nor starve other employees' work.
   */
  drain(): Promise<ExecutionSummary[]> {
    if (this.draining) {
      this.drainAgain = true;
      return this.draining;
    }
    this.draining = this.drainLoop().finally(() => {
      this.draining = undefined;
    });
    return this.draining;
  }

  private async drainLoop(): Promise<ExecutionSummary[]> {
    const summaries: ExecutionSummary[] = [];
    const skipped = new Set<string>();
    do {
      this.drainAgain = false;
      for (;;) {
        const summary = await this.runOnce(skipped);
        if (!summary) break;
        summaries.push(summary);
        if (summary.status === 'blocked') skipped.add(summary.workItemId);
      }
    } while (this.drainAgain);
    return summaries;
  }

  async runOnce(skip: ReadonlySet<string> = new Set()): Promise<ExecutionSummary | null> {
    if (this.busy) return null;
    this.busy = true;
    try {
      const item = await this.nextAssigned(skip);
      if (!item) return null;
      return await this.startRun(item);
    } finally {
      this.busy = false;
    }
  }

  async onApprovalDecision(agentRunId: string): Promise<ExecutionSummary | null> {
    const run = await this.agentRuns.findOne(agentRunId);
    if (run.status !== 'needs_approval') {
      return null;
    }
    const approval = await this.approvals.latestForRun(agentRunId);
    if (!approval || approval.status === 'pending') {
      return null;
    }
    if (approval.status === 'denied') {
      await this.agentRuns.setStatus(agentRunId, 'failed');
      await this.safeFail(run.workItemId ?? '');
      this.logger.log(`Run ${agentRunId} halted: approval denied`);
      return this.summary(run, 'failed', [], 0);
    }
    return this.resumeRun(run);
  }

  private async nextAssigned(skip: ReadonlySet<string> = new Set()): Promise<WorkItem | undefined> {
    // An item is runnable only once everything it depends on is `done`; anything
    // upstream still in flight, failed or cancelled keeps it parked.
    const blockedByDependency = sql`exists (
      select 1 from work_dependencies d
      join work_items dep on dep.id = d.depends_on_work_item_id
      where d.work_item_id = ${workItems.id} and dep.status <> 'done'
    )`;
    const [item] = await this.db
      .select()
      .from(workItems)
      .where(
        and(
          eq(workItems.status, 'assigned'),
          not(blockedByDependency),
          skip.size > 0 ? notInArray(workItems.id, [...skip]) : undefined,
        ),
      )
      .orderBy(desc(workItems.priority), asc(workItems.createdAt))
      .limit(1);
    return item;
  }

  private async startRun(item: WorkItem): Promise<ExecutionSummary> {
    if (!item.assignedEmployeeId) {
      throw new Error(`Work item ${item.id} is assigned but has no employee`);
    }
    const employee = await this.employees.findOne(item.assignedEmployeeId);
    // Omni Router decides WHAT executes this work item (spec §8).
    const selection = this.omni.selectModel(item, employee);
    const runtimeKey = selection.runtimeKey;
    const model = selection.model;

    // Subscription usage limit: hold the item (it stays assigned) and wake up at the reset.
    const heldUntil = this.usageLimits.blockedUntil(runtimeKey);
    if (heldUntil !== null) {
      this.wakeAt(heldUntil);
      return { agentRunId: '', workItemId: item.id, status: 'blocked', model, runtimeKey, filesChanged: [], estimatedCostUsd: 0 };
    }

    // Circuit breaker: block a new run when the budget is already exceeded (§21).
    const budget = await this.budgets.check(employee.id);
    if (budget.state !== 'ok') {
      await this.emitBudgetExceeded(employee.id, budget.spend, budget.state);
      this.logger.warn(
        `Budget ${budget.state} for employee ${employee.id} ($${budget.spend.toFixed(4)}); blocking new run`,
      );
      return {
        agentRunId: '',
        workItemId: item.id,
        status: 'blocked',
        model,
        runtimeKey,
        filesChanged: [],
        estimatedCostUsd: budget.spend,
      };
    }

    const limits = this.buildLimits(employee);
    const run = await this.agentRuns.create({
      workItemId: item.id,
      employeeId: employee.id,
      runtimeKey,
      provider: selection.provider,
      model,
    });

    try {
      // Branch off the project's shared repo so earlier items' work is present; a retry
      // (rework/failed → assigned) continues from its previous, unmerged attempt.
      const previousBranch = (item.artifacts as { branch?: string } | null)?.branch;
      const handle = await this.workspace.prepare({
        employeeId: employee.id,
        workItemId: item.id,
        projectId: item.projectId,
        baseRef: previousBranch,
      });
      await this.agentRuns.attachWorkspace(run.id, handle.id);
      // Cancelled while the workspace was being prepared: stop before an agent ever starts.
      if ((await this.getWorkItem(item.id)).status === 'cancelled') {
        await this.agentRuns.finish(run.id, { status: 'failed', error: 'Cancelled' });
        return { agentRunId: run.id, workItemId: item.id, status: 'failed', model, runtimeKey, filesChanged: [], estimatedCostUsd: 0 };
      }
      await this.work.changeStatus(item.id, { status: 'in_progress' });

      const memoryBlock = await this.memory.recallBlock(employee.id, item.taskType);
      const ctx = this.buildContext(
        run.id,
        item,
        employee,
        handle,
        model,
        limits,
        selection.provider,
        undefined,
        memoryBlock,
      );
      const iterable = this.registry.get(runtimeKey).run(ctx);
      return await this.drive(run.id, item.id, employee.id, model, runtimeKey, handle, iterable, limits);
    } catch (err) {
      return this.fail(run, model, runtimeKey, (err as Error).message);
    }
  }

  private async resumeRun(run: AgentRun): Promise<ExecutionSummary> {
    const model = run.model ?? 'sonnet';
    const runtimeKey = run.runtimeKey;
    try {
      const employee = await this.employees.findOne(run.employeeId);
      const item = await this.getWorkItem(run.workItemId ?? '');
      const handle = await this.loadWorkspace(run.workspaceId);
      if (!run.sessionId) {
        throw new Error(`Run ${run.id} has no session id to resume`);
      }
      const limits = this.buildLimits(employee);

      await this.agentRuns.setStatus(run.id, 'running');
      await this.work.changeStatus(item.id, { status: 'in_progress' });

      const memoryBlock = await this.memory.recallBlock(employee.id, item.taskType);
      const ctx = this.buildContext(
        run.id,
        item,
        employee,
        handle,
        model,
        limits,
        run.provider ?? undefined,
        run.sessionId,
        memoryBlock,
      );
      const iterable = this.registry.get(runtimeKey).resume(run.sessionId, ctx);
      this.logger.log(`Resuming run ${run.id} after approval`);
      return await this.drive(run.id, item.id, employee.id, model, runtimeKey, handle, iterable, limits);
    } catch (err) {
      return this.fail(run, model, runtimeKey, (err as Error).message);
    }
  }

  /** Consumes a runtime event stream with circuit breakers, then finalizes. */
  private async drive(
    runId: string,
    workItemId: string,
    employeeId: string,
    model: string,
    runtimeKey: string,
    handle: WorkspaceHandle,
    iterable: AsyncIterable<RuntimeEvent>,
    limits: RunLimits,
  ): Promise<ExecutionSummary> {
    const transcript: RuntimeEvent[] = [];
    let sessionId: string | undefined;
    let inputTokens = 0;
    let outputTokens = 0;
    let costUsd = 0;
    let toolCalls = 0;
    let completed = false;
    let failedError: string | undefined;
    let pausedApprovalId: string | undefined;
    let killed: KillReason | undefined;
    let limited = false;

    const iterator = iterable[Symbol.asyncIterator]();
    const deadline = Date.now() + limits.maxDurationMs;
    let cancelled = false;
    const abort = this.aborts.get(workItemId);
    const cancelP = new Promise<typeof CANCELLED>((resolve) => {
      if (abort?.signal.aborted) resolve(CANCELLED);
      abort?.signal.addEventListener('abort', () => resolve(CANCELLED), { once: true });
    });
    // Belt and braces: notice a cancel even if its event is delayed or the dispatcher is off.
    const watch = setInterval(() => {
      void this.db
        .select({ status: workItems.status })
        .from(workItems)
        .where(eq(workItems.id, workItemId))
        .then(([row]) => {
          if (row?.status === 'cancelled') abort?.abort();
        })
        .catch(() => undefined);
    }, CANCEL_POLL_MS);
    watch.unref?.();

    try {
      while (true) {
        const remaining = deadline - Date.now();
        if (remaining <= 0) {
          killed = 'timeout';
          break;
        }
        const next = await this.raceNext(iterator, remaining, cancelP);
        if (next === CANCELLED) {
          cancelled = true;
          break;
        }
        if (next === TIMEOUT) {
          killed = 'timeout';
          break;
        }
        if (next.done) break;

        const event = next.value;
        transcript.push(event);

        if (event.kind === 'session') {
          sessionId = event.sessionId;
        } else if (event.kind === 'tool_use') {
          toolCalls += 1;
          if (toolCalls > limits.maxToolCalls) {
            killed = 'tools';
            break;
          }
        } else if (event.kind === 'usage') {
          // Usage events are increments: the same numbers are recorded as cost events,
          // so the run total always equals what the budget circuit breaker sees.
          inputTokens += event.inputTokens;
          outputTokens += event.outputTokens;
          costUsd += event.costUsd;
          await this.budgets.recordCost(runId, employeeId, {
            inputTokens: event.inputTokens,
            outputTokens: event.outputTokens,
            costUsd: event.costUsd,
          });
          const budget = await this.budgets.check(employeeId);
          if (budget.state === 'hard_exceeded') {
            killed = 'budget';
            break;
          }
        } else if (event.kind === 'needs_approval') {
          pausedApprovalId = event.approvalRef;
          break;
        } else if (event.kind === 'completed') {
          completed = true;
          if (event.sessionId) sessionId = event.sessionId;
          break;
        } else if (event.kind === 'failed') {
          failedError = event.error;
        } else if (event.kind === 'rate_limit') {
          this.usageLimits.record(runtimeKey, event);
          if (event.status === 'rejected') {
            limited = true;
            break;
          }
        }
      }
    } finally {
      // Stopping early (limit, kill, cancel): abort the runtime so the agent process ends now, and
      // don't wait forever for a generator that is blocked on its next message.
      clearInterval(watch);
      if (cancelled || killed || limited || pausedApprovalId) abort?.abort();
      await Promise.race([iterator.return?.(), new Promise((r) => setTimeout(r, 15_000).unref?.())]);
      this.aborts.delete(workItemId);
      // Nothing started inside this run's folder may outlive it (e.g. a LibreOffice a script opened).
      if (!pausedApprovalId) await stopProcessesIn(handle.rootPath);
    }

    await this.persistTranscript(runId, transcript);

    const usage = { sessionId, inputTokens, outputTokens, costUsd, toolCalls };

    if (cancelled) {
      return this.finalizeCancelled(runId, workItemId, model, runtimeKey, handle, usage);
    }

    if (!completed && !killed && (limited || looksLikeUsageLimit(failedError))) {
      if (!limited) this.usageLimits.record(runtimeKey, { status: 'rejected' });
      return this.finalizeLimited(runId, workItemId, model, runtimeKey, handle, failedError, usage);
    }
    if (killed) {
      return this.finalizeKilled(runId, workItemId, model, runtimeKey, handle, killed, usage);
    }
    if (pausedApprovalId && !completed) {
      return this.finalizePaused(runId, workItemId, model, runtimeKey, pausedApprovalId, usage);
    }
    return this.finalizeDone(runId, workItemId, model, runtimeKey, handle, completed, failedError, usage);
  }

  /** The work item was cancelled while its agent was running: keep what was written, stop, record it. */
  private async finalizeCancelled(
    runId: string,
    workItemId: string,
    model: string,
    runtimeKey: string,
    handle: WorkspaceHandle,
    usage: RunUsage,
  ): Promise<ExecutionSummary> {
    const collected = await this.workspace.collect(handle);
    await this.agentRuns.finish(runId, {
      status: 'failed',
      sessionId: usage.sessionId,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      estimatedCostUsd: usage.costUsd,
      toolCallCount: usage.toolCalls,
      filesChangedCount: collected.filesChanged.length,
      error: 'Cancelled',
    });
    this.logger.log(`Run ${runId} stopped: work item ${workItemId} was cancelled`);
    return { agentRunId: runId, workItemId, status: 'failed', model, runtimeKey, filesChanged: collected.filesChanged, estimatedCostUsd: usage.costUsd };
  }

  private async raceNext(
    iterator: AsyncIterator<RuntimeEvent>,
    remainingMs: number,
    cancelP: Promise<typeof CANCELLED>,
  ): Promise<IteratorResult<RuntimeEvent> | typeof TIMEOUT | typeof CANCELLED> {
    let timer: NodeJS.Timeout | undefined;
    const timeoutP = new Promise<typeof TIMEOUT>((resolve) => {
      timer = setTimeout(() => resolve(TIMEOUT), remainingMs);
    });
    try {
      return await Promise.race([iterator.next(), timeoutP, cancelP]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private async finalizeKilled(
    runId: string,
    workItemId: string,
    model: string,
    runtimeKey: string,
    handle: WorkspaceHandle,
    reason: KillReason,
    usage: RunUsage,
  ): Promise<ExecutionSummary> {
    const collected = await this.workspace.collect(handle);
    const status = KILL_STATUS[reason];
    await this.agentRuns.finish(runId, {
      status,
      sessionId: usage.sessionId,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      estimatedCostUsd: usage.costUsd,
      toolCallCount: usage.toolCalls,
      filesChangedCount: collected.filesChanged.length,
      error: `killed:${reason}`,
    });
    // Remember the branch so a retry continues from what was written, rather than starting over.
    await this.db
      .update(workItems)
      .set({ artifacts: { branch: collected.branch, filesChanged: collected.filesChanged, agentRunId: runId } })
      .where(eq(workItems.id, workItemId));
    await this.safeFail(workItemId);
    this.logger.warn(`Run ${runId} killed (${reason})`);
    await this.retryAfterLimit(workItemId, reason);
    return {
      agentRunId: runId,
      workItemId,
      status,
      model,
      runtimeKey,
      filesChanged: collected.filesChanged,
      estimatedCostUsd: usage.costUsd,
    };
  }

  private async finalizePaused(
    runId: string,
    workItemId: string,
    model: string,
    runtimeKey: string,
    approvalId: string,
    usage: RunUsage,
  ): Promise<ExecutionSummary> {
    if (usage.sessionId) {
      await this.agentRuns.finish(runId, {
        status: 'needs_approval',
        sessionId: usage.sessionId,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        estimatedCostUsd: usage.costUsd,
        toolCallCount: usage.toolCalls,
      });
      await this.agentRuns.setStatus(runId, 'needs_approval');
    } else {
      // No session to resume from — still park the run, so it is never left "running".
      await this.agentRuns.setStatus(runId, 'needs_approval');
    }
    await this.work.changeStatus(workItemId, { status: 'needs_approval' });
    this.logger.log(`Run ${runId} paused for approval ${approvalId}`);
    return {
      agentRunId: runId,
      workItemId,
      status: 'paused',
      model,
      runtimeKey,
      filesChanged: [],
      estimatedCostUsd: usage.costUsd,
      approvalId,
    };
  }

  /**
   * A run stopped by its time or tool limit was usually making progress (its work so far is
   * committed on its branch), so give it another go from there, within the usual attempt budget.
   * A budget kill is a spending decision and is never retried automatically.
   */
  private async retryAfterLimit(workItemId: string, reason: KillReason): Promise<void> {
    if (reason === 'budget') return;
    const item = await this.getWorkItem(workItemId);
    if (item.status !== 'failed' || !item.assignedEmployeeId) return;
    const attempts = (await this.agentRuns.findByWorkItem(workItemId)).filter((r) => r.status !== 'rate_limited').length;
    const max = Number(process.env.FORGE_MAX_ATTEMPTS ?? DEFAULT_MAX_ATTEMPTS);
    if (attempts >= max) return;
    await this.work.assign(workItemId, { employeeId: item.assignedEmployeeId, assignedBy: `auto_retry_${reason}` });
    this.logger.log(`Work item ${workItemId} hit its ${reason} limit; retry ${attempts + 1}/${max} continues from its branch`);
  }

  /**
   * The subscription usage limit stopped the run. That is nobody's fault: keep what was written
   * (the retry continues from this branch), put the item back in the queue without spending one of
   * its attempts, and resume when the limit resets.
   */
  private async finalizeLimited(
    runId: string,
    workItemId: string,
    model: string,
    runtimeKey: string,
    handle: WorkspaceHandle,
    error: string | undefined,
    usage: RunUsage,
  ): Promise<ExecutionSummary> {
    const collected = await this.workspace.collect(handle);
    await this.agentRuns.finish(runId, {
      status: 'rate_limited',
      sessionId: usage.sessionId,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      estimatedCostUsd: usage.costUsd,
      toolCallCount: usage.toolCalls,
      filesChangedCount: collected.filesChanged.length,
      error: error ?? 'Usage limit reached',
    });
    await this.db
      .update(workItems)
      .set({ artifacts: { branch: collected.branch, filesChanged: collected.filesChanged, agentRunId: runId } })
      .where(eq(workItems.id, workItemId));
    await this.work.changeStatus(workItemId, { status: 'assigned' });
    const until = this.usageLimits.blockedUntil(runtimeKey);
    if (until !== null) this.wakeAt(until);
    return { agentRunId: runId, workItemId, status: 'rate_limited', model, runtimeKey, filesChanged: collected.filesChanged, estimatedCostUsd: usage.costUsd };
  }

  private async finalizeDone(
    runId: string,
    workItemId: string,
    model: string,
    runtimeKey: string,
    handle: WorkspaceHandle,
    completed: boolean,
    failedError: string | undefined,
    usage: RunUsage,
  ): Promise<ExecutionSummary> {
    const collected = await this.workspace.collect(handle);
    const status = completed ? 'completed' : 'failed';

    await this.agentRuns.finish(runId, {
      status,
      sessionId: usage.sessionId,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      estimatedCostUsd: usage.costUsd,
      toolCallCount: usage.toolCalls,
      filesChangedCount: collected.filesChanged.length,
      error: failedError,
    });

    await this.db
      .update(workItems)
      .set({
        artifacts: { branch: collected.branch, filesChanged: collected.filesChanged, agentRunId: runId },
      })
      .where(eq(workItems.id, workItemId));

    await this.work.changeStatus(workItemId, { status: completed ? 'evaluating' : 'failed' });
    this.logger.log(
      `Work item ${workItemId} ${status} (${collected.filesChanged.length} files, $${usage.costUsd.toFixed(4)})`,
    );

    return {
      agentRunId: runId,
      workItemId,
      status,
      model,
      runtimeKey,
      filesChanged: collected.filesChanged,
      estimatedCostUsd: usage.costUsd,
    };
  }

  private buildLimits(employee: EmployeeWithRelations): RunLimits {
    const s = (employee.runtimeConfig?.settings ?? {}) as Record<string, unknown>;
    return {
      maxTurns: Number(s.maxTurns ?? DEFAULT_LIMITS.maxTurns),
      maxToolCalls: Number(s.maxToolCalls ?? DEFAULT_LIMITS.maxToolCalls),
      maxDurationMs: Number(s.maxDurationMs ?? DEFAULT_LIMITS.maxDurationMs),
    };
  }

  private buildContext(
    runId: string,
    item: WorkItem,
    employee: EmployeeWithRelations,
    handle: WorkspaceHandle,
    model: string,
    limits: RunLimits,
    provider?: string,
    resumeSessionId?: string,
    memoryBlock = '',
  ): RuntimeRunContext {
    return {
      workItemId: item.id,
      employeeId: employee.id,
      cwd: handle.rootPath,
      task: this.buildTask(item),
      model,
      provider,
      systemPromptAppend: this.buildClaudeMd(employee, item, memoryBlock),
      allowedTools: this.governance.allowedTools(employee.governance),
      disallowedTools: this.governance.deniedTools(employee.governance),
      limits: { maxTurns: limits.maxTurns, maxToolCalls: limits.maxToolCalls },
      resumeSessionId,
      canUseTool: this.buildGate(runId, item, employee, handle.rootPath),
      abortSignal: this.abortFor(item.id).signal,
    };
  }

  /** One abort switch per running work item: cancelling the item flips it and the agent stops. */
  private readonly aborts = new Map<string, AbortController>();

  private abortFor(workItemId: string): AbortController {
    const ac = new AbortController();
    this.aborts.set(workItemId, ac);
    return ac;
  }

  private buildGate(
    runId: string,
    item: WorkItem,
    employee: EmployeeWithRelations,
    cwd: string,
  ): PermissionCallback {
    return async (toolName, input) => {
      // Workspace confinement is unconditional: no policy can allow an escape.
      const violation = await findPathViolation(cwd, toolName, input);
      if (violation) {
        return { behavior: 'deny', message: violation };
      }
      // Agents run unattended: desktop apps would pop up on the operator's screen and can hang the
      // run (observed live: LibreOffice's export showed a "waiting for printer" dialog).
      const desktop = desktopAppLaunch(toolName, input);
      if (desktop) {
        return { behavior: 'deny', message: `${desktop} is not available here: generate and check documents with a library instead.` };
      }
      const decision = this.governance.evaluate(employee.governance, toolName);
      if (decision === 'deny') {
        return { behavior: 'deny', message: `Tool ${toolName} denied by policy` };
      }
      if (decision === 'allow') {
        return { behavior: 'allow' };
      }
      if (await this.approvals.consumeIfApproved(runId, toolName, input)) {
        return { behavior: 'allow' };
      }
      const approval = await this.approvals.requestIfAbsent({
        agentRunId: runId,
        workItemId: item.id,
        employeeId: employee.id,
        toolName,
        input,
      });
      return { behavior: 'pause', message: `Approval required for ${toolName}`, approvalId: approval.id };
    };
  }

  private async emitBudgetExceeded(employeeId: string, spend: number, state: string): Promise<void> {
    await this.outbox.record(this.db, {
      type: EventTypes.BudgetExceeded,
      aggregateType: 'employee',
      aggregateId: employeeId,
      payload: { spend, state },
    });
  }

  private async fail(
    run: AgentRun,
    model: string,
    runtimeKey: string,
    message: string,
  ): Promise<ExecutionSummary> {
    this.logger.error(`Execution failed for work item ${run.workItemId}: ${message}`);
    await this.agentRuns.finish(run.id, { status: 'failed', error: message });
    await this.safeFail(run.workItemId ?? '');
    return this.summary(run, 'failed', [], 0, model, runtimeKey);
  }

  private summary(
    run: AgentRun,
    status: ExecutionStatus,
    filesChanged: string[],
    estimatedCostUsd: number,
    model = run.model ?? 'unknown',
    runtimeKey = run.runtimeKey,
  ): ExecutionSummary {
    return {
      agentRunId: run.id,
      workItemId: run.workItemId ?? '',
      status,
      model,
      runtimeKey,
      filesChanged,
      estimatedCostUsd,
    };
  }

  private async persistTranscript(runId: string, transcript: RuntimeEvent[]): Promise<void> {
    if (transcript.length === 0) return;
    await mkdir(this.transcriptDir, { recursive: true });
    const raw = transcript.map((e) => JSON.stringify(e)).join('\n');
    const file = path.join(this.transcriptDir, `${runId}.jsonl`);
    await writeFile(file, redactSecrets(raw), 'utf8');
    await this.agentRuns.setTranscriptRef(runId, file);
  }

  private async loadWorkspace(workspaceId: string | null): Promise<WorkspaceHandle> {
    if (!workspaceId) {
      throw new Error('Run has no workspace to resume into');
    }
    const [ws] = await this.db.select().from(workspaces).where(eq(workspaces.id, workspaceId));
    if (!ws) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }
    return { id: ws.id, rootPath: ws.rootPath, branch: ws.gitBranch ?? '', kind: ws.kind };
  }

  private async getWorkItem(id: string): Promise<WorkItem> {
    const [item] = await this.db.select().from(workItems).where(eq(workItems.id, id));
    if (!item) {
      throw new Error(`Work item ${id} not found`);
    }
    return item;
  }

  private async safeFail(workItemId: string): Promise<void> {
    try {
      await this.work.changeStatus(workItemId, { status: 'failed' });
    } catch {
      // Item may already be terminal; ignore.
    }
  }

  private buildTask(item: WorkItem): string {
    return [
      item.title,
      '',
      item.description ?? '',
      '',
      'Complete this task in the current working directory. Create real, working files.',
      'The directory is the shared project repository: it may already contain work from earlier',
      'tasks — read it first and build on it rather than starting over.',
      'When you finish, the project must build and its tests must pass: if package.json defines',
      'build/test/lint scripts they will be run, so make sure everything they reference exists.',
      ...(item.acceptance?.length
        ? [
            '',
            'Your work is accepted only if each of these commands exits 0 (run them yourself before finishing):',
            ...item.acceptance.map((c) => `  - ${c}`),
          ]
        : []),
    ].join('\n');
  }

  private buildClaudeMd(employee: EmployeeWithRelations, item: WorkItem, memoryBlock = ''): string {
    const skills = employee.skills.map((s) => `${s.skillKey} (${s.level})`).join(', ');
    return [
      `# ${employee.name} — ${employee.role}${employee.department ? `, ${employee.department}` : ''}`,
      '',
      employee.description ?? '',
      skills ? `Expertise: ${skills}.` : '',
      '',
      'You are a senior, autonomous employee in an AI company (Forge). Do production-grade work',
      'and own the outcome. Only touch the current working directory.',
      '',
      '## Production standard (what a senior reviewer will check)',
      ...standardsFor(item.taskType).map((s) => `- ${s}`),
      '',
      '## Definition of done',
      '- Run the project\'s tests (and any acceptance checks you are given) before you finish.',
      '- If anything fails, read the error, fix the cause and run them again. Do not stop on a failure.',
      '- Leave the repository working: no broken scripts, no placeholder code.',
      '- Make it runnable by someone who has never seen it: README.md with the exact commands to install,',
      '  run and test it, and a working start command (e.g. "npm start", "python main.py", or the generator',
      '  script for a document). Run it yourself once before you finish; stop anything you started.',
      '- Documents are files you generate with code inside this folder: Excel with openpyxl/exceljs,',
      '  Word with python-docx/docx, PDF with reportlab/pdfkit, slides with python-pptx. Check them by',
      '  reading them back with the same library. Never open, render, preview or print them with',
      '  LibreOffice, Microsoft Office, a browser or any desktop app (those are blocked), and never touch',
      '  files outside this folder.',
      '',
      '## Current task',
      `- ${item.title}`,
      item.description ? `- ${item.description}` : '',
      '',
      memoryBlock,
    ].join('\n');
  }
}

interface RunUsage {
  sessionId?: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  toolCalls: number;
}

const DESKTOP_APPS = /\b(soffice|libreoffice|scalc|swriter|simpress|excel(\.exe)?|winword|powerpnt|mspaint|notepad|explorer\.exe|invoke-item|start-process)\b|(^|[;&|]\s*)start\s+["'\w]|os\.startfile|xdg-open|\bopen\s+-a\b/i;

/** Names the desktop app a shell command would launch, or null. */
export function desktopAppLaunch(toolName: string, input: unknown): string | null {
  if (toolName !== 'Bash' && toolName !== 'PowerShell') return null;
  const command = String((input as { command?: unknown } | null)?.command ?? '');
  const m = command.match(DESKTOP_APPS);
  return m ? `Launching a desktop app (${m[0].trim()})` : null;
}
