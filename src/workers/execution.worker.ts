import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { asc, desc, eq } from 'drizzle-orm';
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
import { ApprovalsService } from '../modules/approvals/approvals.service';
import { BudgetsService } from '../modules/budgets/budgets.service';
import { redactSecrets } from '../modules/governance/redaction';
import { OMNI_ROUTER, OmniRouterPort } from '../modules/routing/omni/omni-router.port';
import { MemoryService } from '../modules/memory/memory.service';

export type ExecutionStatus =
  | 'completed'
  | 'failed'
  | 'paused'
  | 'blocked'
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

const DEFAULT_LIMITS: RunLimits = {
  maxTurns: 40,
  maxToolCalls: 50,
  maxDurationMs: 10 * 60 * 1000,
};

/**
 * Executes assigned work items through the selected runtime with governance
 * gating (§20) and platform-enforced circuit breakers (§21): budget block/kill,
 * max duration, and max tool calls — all independent of the model's judgment.
 */
@Injectable()
export class ExecutionWorker implements OnModuleInit, OnModuleDestroy {
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
  ) {}

  onModuleInit(): void {
    // Tests drive runOnce() directly; the CLI drives it in-process too. Skip prod
    // auto-triggers under the runner or when manual drive is requested.
    if (process.env.VITEST || process.env.FORGE_MANUAL_DRIVE) {
      return;
    }
    // Prod: execute as soon as a work item is assigned (auto-chain).
    this.bus.subscribe(EventTypes.WorkAssigned, () => {
      if (!this.busy) void this.runOnce();
    });
    if (process.env.FORGE_EXECUTION_WORKER === '1') {
      this.timer = setInterval(() => {
        if (!this.busy) void this.runOnce();
      }, 2000);
      this.timer.unref?.();
    }
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async runOnce(): Promise<ExecutionSummary | null> {
    if (this.busy) return null;
    this.busy = true;
    try {
      const item = await this.nextAssigned();
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

  private async nextAssigned(): Promise<WorkItem | undefined> {
    const [item] = await this.db
      .select()
      .from(workItems)
      .where(eq(workItems.status, 'assigned'))
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
      const handle = await this.workspace.prepare({ employeeId: employee.id, workItemId: item.id });
      await this.agentRuns.attachWorkspace(run.id, handle.id);
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
    const model = run.model ?? 'claude-sonnet-4-6';
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

    const iterator = iterable[Symbol.asyncIterator]();
    const deadline = Date.now() + limits.maxDurationMs;

    try {
      while (true) {
        const remaining = deadline - Date.now();
        if (remaining <= 0) {
          killed = 'timeout';
          break;
        }
        const next = await this.raceNext(iterator, remaining);
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
          inputTokens = event.inputTokens;
          outputTokens = event.outputTokens;
          costUsd = event.costUsd;
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
        }
      }
    } finally {
      await iterator.return?.();
    }

    await this.persistTranscript(runId, transcript);

    const usage = { sessionId, inputTokens, outputTokens, costUsd, toolCalls };

    if (killed) {
      return this.finalizeKilled(runId, workItemId, model, runtimeKey, handle, killed, usage);
    }
    if (pausedApprovalId && !completed) {
      return this.finalizePaused(runId, workItemId, model, runtimeKey, pausedApprovalId, usage);
    }
    return this.finalizeDone(runId, workItemId, model, runtimeKey, handle, completed, failedError, usage);
  }

  private async raceNext(
    iterator: AsyncIterator<RuntimeEvent>,
    remainingMs: number,
  ): Promise<IteratorResult<RuntimeEvent> | typeof TIMEOUT> {
    let timer: NodeJS.Timeout | undefined;
    const timeoutP = new Promise<typeof TIMEOUT>((resolve) => {
      timer = setTimeout(() => resolve(TIMEOUT), remainingMs);
    });
    try {
      return await Promise.race([iterator.next(), timeoutP]);
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
    await this.safeFail(workItemId);
    this.logger.warn(`Run ${runId} killed (${reason})`);
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
      systemPromptAppend: this.buildClaudeMd(employee.name, employee.role, item, memoryBlock),
      allowedTools: this.governance.allowedTools(employee.governance),
      limits: { maxTurns: limits.maxTurns, maxToolCalls: limits.maxToolCalls },
      resumeSessionId,
      canUseTool: this.buildGate(runId, item, employee),
    };
  }

  private buildGate(
    runId: string,
    item: WorkItem,
    employee: EmployeeWithRelations,
  ): PermissionCallback {
    return async (toolName, input) => {
      const decision = this.governance.evaluate(employee.governance, toolName);
      if (decision === 'deny') {
        return { behavior: 'deny', message: `Tool ${toolName} denied by policy` };
      }
      if (decision === 'allow') {
        return { behavior: 'allow' };
      }
      if (await this.approvals.consumeIfApproved(runId, toolName)) {
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
    ].join('\n');
  }

  private buildClaudeMd(name: string, role: string, item: WorkItem, memoryBlock = ''): string {
    return [
      `# ${name} — ${role}`,
      '',
      'You are an autonomous employee in an AI company (Forge). Do high-quality,',
      'production-grade work. Only touch the current working directory.',
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
