import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { and, asc, desc, eq, inArray, isNotNull, not, notInArray, sql } from 'drizzle-orm';
import { appendFile, mkdir, writeFile } from 'node:fs/promises';
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
import { UsageLimits, fallbackSelection, looksLikeUsageLimit } from '../modules/runtimes/usage-limits';
import { stopProcessesIn } from './process-cleanup';
import { evaluations } from '../modules/evaluation/evaluation.schema';
import { agentRuns } from '../modules/runtimes/agent-runs.schema';
import { standardsFor } from '../modules/work/standards';
import { countAttempts } from '../modules/runtimes/attempts';
import { brandBrief, describeBrand } from '../modules/brands/brand-library';
import { SHARED_RULES, briefForEmployee, renderBrief } from '../modules/employees/employee-briefs';
import { readFileSync } from 'node:fs';

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

type KillReason = 'budget' | 'timeout' | 'tools' | 'turns';
type KillStatus = 'killed_budget' | 'killed_timeout' | 'killed_tools';
const KILL_STATUS: Record<KillReason, KillStatus> = {
  budget: 'killed_budget',
  timeout: 'killed_timeout',
  tools: 'killed_tools',
  // The agent used all its turns: like the tool ceiling, a limit that more time can fix.
  turns: 'killed_tools',
};
const TIMEOUT = Symbol('timeout');
const CANCELLED = Symbol('cancelled');
const CANCEL_POLL_MS = Number(process.env.FORGE_CANCEL_POLL_MS ?? 3000);

// Real deliverables (installs, large generated files on Opus) need room; observed live: a workbook
// task was cut off at 10 minutes mid-write. FORGE_MAX_RUN_MINUTES overrides the default per run.
const DEFAULT_LIMITS: RunLimits = {
  maxTurns: 100,
  maxToolCalls: 200,
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
    // Safety net: re-check the queue every minute, so held work resumes even if a wake-up timer was
    // missed (observed live: a PC asleep past a usage-limit reset left work waiting until morning).
    const sweep = setInterval(() => this.kick(), 60_000);
    sweep.unref?.();
    this.bus.subscribe(EventTypes.WorkStatusChanged, (event) => {
      if ((event.payload as { to?: string }).to === 'done') this.kick();
    });
  }

  /** Resume anything left assigned from before this process started. */
  onApplicationBootstrap(): void {
    if (process.env.VITEST || process.env.FORGE_MANUAL_DRIVE) return;
    void this.recoverInterrupted()
      .catch((err) => this.logger.error(`Recovering interrupted runs failed: ${(err as Error).message}`))
      .finally(() => this.kick());
  }

  /**
   * Runs that were in flight when Forge stopped (restart, crash, PC shut down) would otherwise stay
   * "running" forever. Save what they had written, record the interruption, and put the item back in
   * the queue so the next attempt continues from that work.
   */
  async recoverInterrupted(): Promise<number> {
    const orphans = await this.db.select().from(agentRuns).where(and(eq(agentRuns.status, 'running'), isNotNull(agentRuns.workItemId)));
    for (const run of orphans) {
      try {
        let artifacts: Record<string, unknown> | undefined;
        if (run.workspaceId) {
          const handle = await this.loadWorkspace(run.workspaceId);
          await stopProcessesIn(handle.rootPath);
          const collected = await this.workspace.collect(handle);
          artifacts = { branch: collected.branch, filesChanged: collected.filesChanged, agentRunId: run.id };
        }
        await this.agentRuns.finish(run.id, { status: 'rate_limited', error: 'Interrupted: Forge stopped while this run was working; continuing from its saved work' });
        if (artifacts) await this.db.update(workItems).set({ artifacts }).where(eq(workItems.id, run.workItemId!));
        const item = await this.getWorkItem(run.workItemId!);
        if (item.status === 'in_progress') await this.work.changeStatus(item.id, { status: 'assigned' });
        this.logger.log(`Recovered interrupted run ${run.id}; work item ${item.id} requeued`);
      } catch (err) {
        this.logger.warn(`Could not recover run ${run.id}: ${(err as Error).message}`);
      }
    }
    return orphans.length;
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
  /** Wakes a drain that is waiting on running items, so newly runnable work starts at once. */
  private wakeDrain?: () => void;
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
      // New work arrived while others run: fill free slots now, not when a running item finishes.
      this.wakeDrain?.();
      return this.draining;
    }
    this.draining = this.drainLoop().finally(() => {
      this.draining = undefined;
    });
    return this.draining;
  }

  /**
   * Works the queue like a team: up to FORGE_CONCURRENCY items run at the same time, one per
   * employee — whoever is free takes the next runnable item instead of waiting for the others.
   * An item is never started twice; a blocked item is skipped for the rest of the drain.
   */
  private async drainLoop(): Promise<ExecutionSummary[]> {
    const summaries: ExecutionSummary[] = [];
    const skipped = new Set<string>();
    const concurrency = Math.max(1, Number(process.env.FORGE_CONCURRENCY ?? DEFAULT_CONCURRENCY) || 1);
    const running = new Map<string, Promise<{ id: string; summary: ExecutionSummary | null }>>();
    const busyEmployees = new Map<string, string>(); // workItemId -> employeeId
    do {
      this.drainAgain = false;
      // Spread one person's queued, independent steps across same-role teammates before starting.
      await this.spreadQueued().catch((err) => this.logger.warn(`Spreading queued work failed: ${(err as Error).message}`));
      for (;;) {
        while (running.size < concurrency) {
          const taken = new Set([...skipped, ...running.keys()]);
          const busy = [...busyEmployees.values()];
          // Ready work whose owner is busy goes to a teammate in the same role (added if needed).
          const item = (await this.nextAssigned(taken, busy)) ?? (await this.staffUp(taken, busy));
          if (!item) break;
          busyEmployees.set(item.id, item.assignedEmployeeId ?? '');
          running.set(
            item.id,
            this.startRun(item)
              .catch((err) => {
                this.logger.error(`Run for work item ${item.id} crashed: ${(err as Error).message}`);
                return null;
              })
              .then((summary) => ({ id: item.id, summary })),
          );
        }
        if (running.size === 0) break;
        const woken = new Promise<null>((resolve) => {
          this.wakeDrain = () => resolve(null);
        });
        const next = await Promise.race([...running.values(), woken]);
        this.wakeDrain = undefined;
        // Woken by new work (observed live: a freshly planned goal sat idle until an unrelated run finished).
        if (next === null) continue;
        const { id, summary } = next;
        running.delete(id);
        busyEmployees.delete(id);
        if (summary) {
          summaries.push(summary);
          if (summary.status === 'blocked') skipped.add(summary.workItemId);
        }
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

  private intakePaused = false;

  /**
   * Drain mode for safe restarts: while paused, nothing new starts, but work already running (and its
   * checks) finishes normally. Restart once `activeWork()` reports zero, so no run is ever cut off.
   */
  pauseIntake(paused: boolean): void {
    this.intakePaused = paused;
    this.logger.log(paused ? 'Intake paused: finishing current work, starting nothing new' : 'Intake resumed');
    if (!paused) this.kick();
  }

  get isIntakePaused(): boolean {
    return this.intakePaused;
  }

  /** Runs in flight and items being checked; a restart is safe only at zero. */
  async activeWork(): Promise<{ running: number; evaluating: number }> {
    const [row] = await this.db
      .select({
        running: sql<number>`(select count(*) from ${agentRuns} where ${eq(agentRuns.status, 'running')})`,
        evaluating: sql<number>`(select count(*) from ${workItems} where ${eq(workItems.status, 'evaluating')})`,
      })
      .from(sql`(select 1) as one`);
    return { running: Number(row?.running ?? 0), evaluating: Number(row?.evaluating ?? 0) };
  }

  /**
   * Parallel staffing: a ready item waits only because its owner is busy on another item. Give it to
   * a free teammate with the same role, or add one (same role, skills, brief and model) up to
   * FORGE_MAX_PER_ROLE people per role, so independent work runs side by side instead of queueing.
   * Executives are never cloned; FORGE_AUTOSTAFF=0 turns this off.
   */
  private async staffUp(skip: ReadonlySet<string>, busyEmployees: string[]): Promise<WorkItem | undefined> {
    if (process.env.FORGE_AUTOSTAFF === '0' || busyEmployees.length === 0 || this.intakePaused) return undefined;
    const blockedByDependency = sql`exists (
      select 1 from work_dependencies d
      join work_items dep on dep.id = d.depends_on_work_item_id
      where d.work_item_id = ${workItems.id} and dep.status <> 'done'
    )`;
    const waiting = await this.db
      .select()
      .from(workItems)
      .where(
        and(
          eq(workItems.status, 'assigned'),
          not(blockedByDependency),
          skip.size > 0 ? notInArray(workItems.id, [...skip]) : undefined,
          inArray(workItems.assignedEmployeeId, busyEmployees),
        ),
      )
      .orderBy(desc(workItems.priority), asc(workItems.createdAt))
      .limit(5);
    const maxPerRole = Math.max(1, Number(process.env.FORGE_MAX_PER_ROLE ?? DEFAULT_MAX_PER_ROLE) || 1);
    for (const item of waiting) {
      const owner = await this.employees.findOne(item.assignedEmployeeId!);
      if (isExecutiveRole(owner.role)) continue;
      const sameRole = (await this.employees.findByCompany(owner.companyId)).filter(
        (e) => e.role.toLowerCase() === owner.role.toLowerCase(),
      );
      let helper: { id: string; name: string } | undefined = sameRole.find((e) => e.id !== owner.id && !busyEmployees.includes(e.id));
      if (!helper && sameRole.length < maxPerRole) helper = await this.addTeammate(owner, sameRole.map((e) => e.name));
      if (!helper) continue;
      const reassigned = await this.work.reassign(item.id, helper.id, `auto_staff:${owner.name}`);
      this.logger.log(`Parallel staffing: "${item.title}" goes to ${helper.name} (${owner.role}) while ${owner.name} is busy`);
      return reassigned;
    }
    return undefined;
  }

  /**
   * Planned parallel work should be visible and staffed up front: when one person has several queued
   * steps, they are shared round-robin across up to FORGE_MAX_PER_ROLE people in that role (free
   * teammates first, then new ones), so independent steps start together instead of one by one.
   * Executives are never spread; FORGE_AUTOSTAFF=0 turns this off.
   */
  async spreadQueued(): Promise<number> {
    if (process.env.FORGE_AUTOSTAFF === '0' || this.intakePaused) return 0;
    const queued = await this.db
      .select()
      .from(workItems)
      .where(and(eq(workItems.status, 'assigned'), isNotNull(workItems.assignedEmployeeId)))
      .orderBy(asc(workItems.createdAt));
    const byOwner = new Map<string, WorkItem[]>();
    for (const item of queued) byOwner.set(item.assignedEmployeeId!, [...(byOwner.get(item.assignedEmployeeId!) ?? []), item]);
    const maxPerRole = Math.max(1, Number(process.env.FORGE_MAX_PER_ROLE ?? DEFAULT_MAX_PER_ROLE) || 1);
    let moved = 0;
    for (const [ownerId, items] of byOwner) {
      if (items.length < 2) continue;
      const owner = await this.employees.findOne(ownerId);
      if (isExecutiveRole(owner.role)) continue;
      const sameRole = (await this.employees.findByCompany(owner.companyId)).filter(
        (e) => e.role.toLowerCase() === owner.role.toLowerCase() && e.id !== owner.id,
      );
      // Free teammates first (those with queued work keep it), then new ones, never more than the cap.
      const target = Math.min(maxPerRole, items.length);
      const pool: Array<{ id: string; name: string }> = [{ id: owner.id, name: owner.name }];
      for (const e of sameRole) if (pool.length < target && !byOwner.has(e.id)) pool.push(e);
      let roleSize = 1 + sameRole.length;
      while (pool.length < target && roleSize < maxPerRole) {
        pool.push(await this.addTeammate(owner, pool.map((x) => x.name)));
        roleSize += 1;
      }
      if (pool.length < 2) continue;
      for (const [i, item] of items.entries()) {
        const to = pool[i % pool.length];
        if (to.id === ownerId) continue;
        await this.work.reassign(item.id, to.id, `auto_staff:${owner.name}`);
        moved += 1;
        this.logger.log(`Parallel staffing: "${item.title}" goes to ${to.name} (${owner.role}) so it can run alongside ${owner.name}'s work`);
      }
    }
    return moved;
  }

  /** A new teammate with the same role, skills, brief and model as `owner`, reporting to the same manager. */
  private async addTeammate(owner: EmployeeWithRelations, taken: string[]): Promise<{ id: string; name: string }> {
    const roster = (await this.employees.findByCompany(owner.companyId)).map((e) => e.name.toLowerCase());
    const name = TEAMMATE_NAMES.find((n) => !roster.includes(n.toLowerCase()) && !taken.includes(n)) ?? `${owner.name} ${taken.length + 1}`;
    const rc = owner.runtimeConfig;
    const hired = await this.employees.create(owner.companyId, {
      name,
      role: owner.role,
      department: owner.department ?? undefined,
      description: owner.description ?? undefined,
      managerEmployeeId: owner.managerEmployeeId ?? undefined,
      runtimeConfig: rc
        ? { runtimeKey: rc.runtimeKey, provider: rc.provider ?? undefined, modelPolicy: rc.modelPolicy as Record<string, unknown>, settings: rc.settings as Record<string, unknown> }
        : undefined,
      skills: owner.skills.map((s) => ({ skillKey: s.skillKey, level: s.level })),
      governance: owner.governance as never,
    });
    this.logger.log(`Parallel staffing: added ${name} as another ${owner.role}`);
    return { id: hired.id, name };
  }

  private async nextAssigned(skip: ReadonlySet<string> = new Set(), busyEmployees: string[] = []): Promise<WorkItem | undefined> {
    if (this.intakePaused) return undefined;
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
          // One task per person at a time: someone already working is not free.
          busyEmployees.length > 0 ? notInArray(workItems.assignedEmployeeId, busyEmployees) : undefined,
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
    let selection = this.omni.selectModel(item, employee);

    // Subscription usage limit: switch to the fallback endpoint (OmniRoute/OpenRouter…) when one is
    // configured; otherwise hold the item (it stays assigned) and wake up at the reset.
    const heldUntil = this.usageLimits.blockedUntil(selection.runtimeKey);
    let fallbackUntil: number | null = null;
    if (heldUntil !== null) {
      const fallback = fallbackSelection(selection.runtimeKey);
      // A step the fallback already tried several times waits for Claude instead (observed live: weaker
      // fallback models looped on the same build errors until the step ran out of attempts).
      const fallbackTries = fallback
        ? (await this.agentRuns.findByWorkItem(item.id)).filter((r) => r.runtimeKey === fallback.runtimeKey && r.status !== 'rate_limited').length
        : 0;
      if (fallback && this.usageLimits.blockedUntil(fallback.runtimeKey) === null && fallbackTries < MAX_FALLBACK_TRIES) {
        this.logger.log(`${selection.runtimeKey} is at its usage limit; running work item ${item.id} on ${fallback.provider}:${fallback.model}`);
        selection = fallback;
        fallbackUntil = heldUntil;
      } else {
        this.wakeAt(heldUntil);
        return { agentRunId: '', workItemId: item.id, status: 'blocked', model: selection.model, runtimeKey: selection.runtimeKey, filesChanged: [], estimatedCostUsd: 0 };
      }
    }
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
      // Branch off the project's shared repo so earlier items' work is present; a retry
      // (rework/failed → assigned) continues from its previous, unmerged attempt.
      const prior = (item.artifacts as { branch?: string; conflict?: string } | null) ?? {};
      const previousBranch = prior.branch;
      // After a merge conflict, start from the latest shared project with this work merged in, so the
      // clash is resolved once instead of the retry colliding again and again.
      const handle = await this.workspace.prepare({
        employeeId: employee.id,
        workItemId: item.id,
        projectId: item.projectId,
        ...(prior.conflict ? { mergeFrom: previousBranch } : { baseRef: previousBranch }),
      });
      await this.agentRuns.attachWorkspace(run.id, handle.id);
      // Cancelled while the workspace was being prepared: stop before an agent ever starts.
      if ((await this.getWorkItem(item.id)).status === 'cancelled') {
        await this.agentRuns.finish(run.id, { status: 'failed', error: 'Cancelled' });
        return { agentRunId: run.id, workItemId: item.id, status: 'failed', model, runtimeKey, filesChanged: [], estimatedCostUsd: 0 };
      }
      await this.work.changeStatus(item.id, { status: 'in_progress' });

      const memoryBlock = await this.memory.recallBlock(employee.id, item.taskType);
      // A retry is told exactly what failed last time (check output, design-review findings).
      const feedback = await this.previousFeedback(item.id);
      const ctx = this.buildContext(
        run.id,
        feedback ? { ...item, description: `${item.description ?? ''}\n\n${feedback}` } : item,
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
      if (fallbackUntil !== null) return this.fallbackUnavailable(run, item.id, model, runtimeKey, fallbackUntil, (err as Error).message);
      return this.fail(run, model, runtimeKey, (err as Error).message);
    }
  }

  /**
   * The fallback endpoint could not answer while the main runtime is at its usage limit. That is not
   * the work's fault: never fail the item (observed live: a fallback 502 failed a step outright and
   * nothing resumed it after the reset). Stop using the fallback until the main runtime resets, put
   * the item back in the queue without spending an attempt, and wake up at the reset.
   */
  private async fallbackUnavailable(
    run: AgentRun,
    workItemId: string,
    model: string,
    runtimeKey: string,
    resumeAt: number,
    message: string,
  ): Promise<ExecutionSummary> {
    // Try the fallback again soon (its providers recover), and in any case when Claude resets.
    const retryAt = Math.min(resumeAt, Date.now() + FALLBACK_RETRY_MS);
    this.logger.warn(`Fallback ${runtimeKey}:${model} unavailable (${message.slice(0, 160)}); holding work item ${workItemId}, retrying the fallback at ${new Date(retryAt).toISOString()}`);
    this.usageLimits.record(runtimeKey, { status: 'rejected', resetsAt: retryAt, limitType: 'fallback_unavailable' });
    await this.agentRuns.finish(run.id, { status: 'rate_limited', error: `Fallback unavailable: ${message.slice(0, 300)}. Retrying it shortly; Claude takes over again when its limit resets.` });
    const item = await this.getWorkItem(workItemId);
    if (item.status === 'in_progress') await this.work.changeStatus(workItemId, { status: 'assigned' });
    this.wakeAt(retryAt);
    return { agentRunId: run.id, workItemId, status: 'blocked', model, runtimeKey, filesChanged: [], estimatedCostUsd: 0 };
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
    let resultText = '';

    const iterator = iterable[Symbol.asyncIterator]();
    let deadline = Date.now() + limits.maxDurationMs;
    // Sleep-proof: when the clock jumps (the PC slept), the run could not work during the gap, so the
    // gap does not count against its time budget (observed live: overnight sleep killed runs on wake).
    let lastTick = Date.now();
    let pending: Promise<IteratorResult<RuntimeEvent>> | null = null;
    const sleepGuard = setInterval(() => {
      const now = Date.now();
      const gap = now - lastTick - 5_000;
      if (gap > 20_000) {
        deadline += gap;
        this.logger.log(`Run ${runId}: clock jumped ${Math.round(gap / 1000)}s (sleep?); time budget extended`);
      }
      lastTick = now;
    }, 5_000);
    sleepGuard.unref?.();
    // Live view: every event is appended to the transcript as it happens, so the console shows what the
    // agent is doing right now (not only after the run ends) and a stuck run is visible as one.
    const live = await this.openLiveTranscript(runId);
    let lastProgressAt = 0;
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
        // Keep one pending read across wake-ups, so no event is ever requested twice (and lost).
        pending ??= iterator.next();
        const next = await this.raceNext(pending, remaining, cancelP);
        if (next !== TIMEOUT && next !== CANCELLED) pending = null;
        if (next === CANCELLED) {
          cancelled = true;
          break;
        }
        if (next === TIMEOUT) {
          // The deadline may have moved (sleep detected meanwhile): only a real overrun stops the run.
          if (deadline - Date.now() > 0) continue;
          killed = 'timeout';
          break;
        }
        if (next.done) break;

        const event = next.value;
        transcript.push(event);
        live.write(event);
        if ((event.kind === 'tool_use' || event.kind === 'usage') && Date.now() - lastProgressAt > 3_000) {
          lastProgressAt = Date.now();
          void this.db
            .update(agentRuns)
            .set({ toolCallCount: toolCalls + (event.kind === 'tool_use' ? 1 : 0), estimatedCostUsd: costUsd })
            .where(eq(agentRuns.id, runId))
            .catch(() => undefined);
        }

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
          resultText = event.result;
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
    } catch (err) {
      // The SDK throws the turn limit instead of emitting `failed` (observed live: "Reached maximum
      // number of turns (100)" failed a step outright). Treat it like the reported limit so the work
      // continues; any other thrown error keeps its own handling in the caller.
      if (!ranOutOfTurns((err as Error).message)) throw err;
      failedError = (err as Error).message;
    } finally {
      // Stopping early (limit, kill, cancel): abort the runtime so the agent process ends now, and
      // don't wait forever for a generator that is blocked on its next message.
      clearInterval(watch);
      clearInterval(sleepGuard);
      if (cancelled || killed || limited || pausedApprovalId) abort?.abort();
      await Promise.race([iterator.return?.(), new Promise((r) => setTimeout(r, 15_000).unref?.())]);
      this.aborts.delete(workItemId);
      // Nothing started inside this run's folder may outlive it (e.g. a LibreOffice a script opened).
      if (!pausedApprovalId) await stopProcessesIn(handle.rootPath);
    }

    // The live file already holds every event (with timestamps); rewrite only if streaming failed.
    if (!(await live.close())) await this.persistTranscript(runId, transcript);

    const usage = { sessionId, inputTokens, outputTokens, costUsd, toolCalls };

    // Self-reflection: the lessons the employee wrote at the end of the task become their memory.
    if (completed) await this.harvestReflection(employeeId, workItemId, runId, resultText);

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
    // Ran out of turns mid-work (observed live: a whole-project review needed more than 60): keep
    // the work and continue from it in another attempt, like the time and tool limits.
    if (!completed && ranOutOfTurns(failedError)) {
      return this.finalizeKilled(runId, workItemId, model, runtimeKey, handle, 'turns', usage);
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
    pending: Promise<IteratorResult<RuntimeEvent>>,
    remainingMs: number,
    cancelP: Promise<typeof CANCELLED>,
  ): Promise<IteratorResult<RuntimeEvent> | typeof TIMEOUT | typeof CANCELLED> {
    let timer: NodeJS.Timeout | undefined;
    const timeoutP = new Promise<typeof TIMEOUT>((resolve) => {
      timer = setTimeout(() => resolve(TIMEOUT), remainingMs);
    });
    try {
      return await Promise.race([pending, timeoutP, cancelP]);
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
    const { attempts, continuations } = countAttempts(await this.agentRuns.findByWorkItem(workItemId));
    const max = Number(process.env.FORGE_MAX_ATTEMPTS ?? DEFAULT_MAX_ATTEMPTS);
    if (attempts >= max) return;
    await this.work.assign(workItemId, { employeeId: item.assignedEmployeeId, assignedBy: `auto_retry_${reason}` });
    this.logger.log(
      `Work item ${workItemId} hit its ${reason} limit; continues from its branch (attempt ${attempts + 1}/${max}, ${continuations} continuation(s) so far)`,
    );
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
      systemPromptAppend: this.buildClaudeMd(employee, item, memoryBlock, handle.rootPath),
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

  /** Appends events to the run's transcript file in order, as they arrive; failures never stop the run. */
  private async openLiveTranscript(runId: string): Promise<{ write(e: RuntimeEvent): void; close(): Promise<boolean> }> {
    const file = path.join(this.transcriptDir, `${runId}.jsonl`);
    let ok = true;
    const fail = (e: unknown) => {
      if (ok) this.logger.warn(`Live transcript for ${runId} unavailable: ${String(e)}`);
      ok = false;
    };
    let chain: Promise<unknown> = mkdir(this.transcriptDir, { recursive: true })
      .then(() => writeFile(file, '', 'utf8'))
      .then(() => this.agentRuns.setTranscriptRef(runId, file))
      .catch(fail);
    return {
      write: (e) => {
        const line = redactSecrets(JSON.stringify({ ...e, at: new Date().toISOString() })) + '\n';
        chain = chain.then(() => (ok ? appendFile(file, line, 'utf8') : undefined)).catch(fail);
      },
      close: async () => {
        await chain;
        return ok;
      },
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

  /** Saves the "## Lessons" an employee wrote at the end of a task as their own memories. */
  private async harvestReflection(employeeId: string, workItemId: string, runId: string, resultText: string): Promise<void> {
    const lessons = extractLessons(resultText);
    if (!lessons.length) return;
    const [item] = await this.db.select({ taskType: workItems.taskType }).from(workItems).where(eq(workItems.id, workItemId));
    for (const lesson of lessons) {
      await this.memory.remember({ employeeId, kind: 'lesson', taskType: item?.taskType ?? null, sourceRunId: runId, salience: 65, content: `Reflection: ${lesson}` });
    }
  }

  /** What the last evaluation of this item found wrong, written for the person fixing it. */
  private async previousFeedback(workItemId: string): Promise<string | null> {
    const [latest] = await this.db
      .select()
      .from(evaluations)
      .where(eq(evaluations.workItemId, workItemId))
      .orderBy(desc(evaluations.createdAt))
      .limit(1);
    const [own] = await this.db.select({ artifacts: workItems.artifacts }).from(workItems).where(eq(workItems.id, workItemId));
    const conflict = (own?.artifacts as { conflict?: string } | null)?.conflict;
    if (conflict) {
      return [
        '## Your previous work passed its checks but clashed with work a teammate merged meanwhile',
        'You start from the latest shared project with your work merged in. Conflicting spots are marked with',
        "<<<<<<< / ======= / >>>>>>> in the files below: reconcile each one keeping BOTH sides' intent, remove",
        'the markers, and make sure everything still builds and passes.',
        String(conflict).slice(-1500),
      ].join('\n');
    }
    if (!latest || latest.status !== 'failed') return null;
    const dims = (latest.detail as { dimensions?: Record<string, { exitCode?: number; command?: string; output?: string }> }).dimensions ?? {};
    const failing = Object.entries(dims).filter(([, d]) => d.exitCode !== 0);
    if (!failing.length) return null;
    return [
      '## Your previous attempt was rejected — fix these before anything else',
      ...failing.map(([name, d]) => `### ${name === 'visual' ? 'Design review' : name}: ${d.command ?? ''}\n${String(d.output ?? '').slice(-2500)}`),
    ].join('\n\n');
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

  /**
   * The employee's system prompt, most stable first so the prefix is prompt-cached across tasks:
   * shared rules → Forge platform rules → this employee's brief → brand → lessons → this task.
   */
  private buildClaudeMd(employee: EmployeeWithRelations, item: WorkItem, memoryBlock = '', rootPath?: string): string {
    const brief = briefForEmployee(employee);
    const brand = rootPath ? projectBrandName(rootPath) : null;
    const minutes = Math.round(this.buildLimits(employee).maxDurationMs / 60000);
    return [
      SHARED_RULES,
      '',
      FORGE_RULES,
      '',
      '---',
      '',
      // A teammate added for parallel work shares the role's brief under their own name.
      brief ? renderBrief({ ...brief, name: employee.name }) : legacyIdentity(employee),
      '',
      `Time budget: about ${minutes} minutes per run (hard stop). Deliver the required files in the first half, then refine.`,
      '',
      '---',
      '',
      ...(brand ? [...brandBrief(brand), ''] : []),
      ...(memoryBlock.trim() ? [memoryBlock.trim(), ''] : []),
      '## Standards for this kind of task',
      ...standardsFor(item.taskType).map((s) => `- ${s}`),
      '',
      '## Current task',
      `- ${item.title}`,
      item.description ? `- ${item.description}` : '',
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

/** The bullet points under a "## Lessons" heading in an agent's final message (at most 3). */
export function extractLessons(text: string): string[] {
  const m = String(text ?? '').match(/^#{1,4}\s*Lessons[^\n]*\n([\s\S]*?)(?=^#{1,4}\s|\s*$(?![\s\S]))/im);
  if (!m) return [];
  return m[1]
    .split('\n')
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter((l) => l.length > 10)
    .slice(0, 3)
    .map((l) => l.slice(0, 400));
}

/**
 * The agent used up its turn allowance. Claude Code reports this as the result subtype
 * `error_max_turns` (observed live: a step was failed outright instead of continuing), and in
 * other places as "Reached maximum number of turns (N)".
 */
export function ranOutOfTurns(error: string | undefined): boolean {
  return /maximum number of turns|error_max_turns/i.test(error ?? '');
}

/** The brand the project follows, from the BRAND.md committed into it (null when it has none). */
export function projectBrandName(rootPath: string): string | null {
  try {
    const content = readFileSync(path.join(rootPath, 'BRAND.md'), 'utf8');
    return describeBrand('brand', content).name;
  } catch {
    return null;
  }
}

/**
 * How work happens inside Forge: the same for every employee and task (so it is cached), and the
 * place where the shared rules' generic words ("escalate", "hand-off") get their Forge meaning.
 */
export const FORGE_RULES = [
  'HOW FORGE WORKS',
  '- You work alone in the current directory, a checkout of the shared project. Only touch files inside it.',
  '- Teammates build other parts at the same time. If your task says "Owns: ...", change only those folders/files;',
  '  anything you need elsewhere goes in your hand-off as a follow-up, so parallel work merges without conflicts.',
  "- Your work is checked automatically when you finish: the project's lint/test/build scripts and the task's",
  '  acceptance checks must pass. Run them yourself first; a failing check sends the work straight back.',
  '- To escalate: stop, finish with your hand-off, and start "Risks & follow-ups" with "ESCALATION:" plus the',
  '  evidence (command, output, what you tried). Do not keep trying the same fix.',
  '- Leave the repository runnable by someone who has never seen it: README.md with the exact install, run and',
  '  test commands and a working start command. Run it once yourself and stop anything you started.',
  '- Documents are files you generate with code in this folder (Excel: openpyxl/exceljs, Word: python-docx/docx,',
  '  PDF: reportlab/pdfkit, slides: python-pptx) and check by reading them back with the same library. Never open',
  '  them with LibreOffice, Office, a browser or any desktop app (blocked).',
  '- After the hand-off, end with a "## Lessons" section: 1-3 short, specific, reusable lessons from this task.',
  '  They become your memory and your team\'s playbook.',
].join('\n');

/** Identity for an employee with no written brief (a custom hire in a new role). */
function legacyIdentity(employee: EmployeeWithRelations): string {
  const skills = employee.skills.map((s) => s.skillKey).join(', ');
  return [
    `# You are ${employee.name}, ${employee.role}${employee.department ? ` (${employee.department})` : ''}`,
    '',
    employee.description ?? '',
    skills ? `Your expertise: ${skills}.` : '',
  ].join('\n');
}

/** Fallback runs per step before it waits for Claude instead (below the free fallback runs in attempts.ts). */
const MAX_FALLBACK_TRIES = 3;

/** How soon a fallback that failed is tried again (its providers often recover within minutes). */
const FALLBACK_RETRY_MS = 10 * 60_000;

/** Parallel slots: how many items run at the same time across the company. */
const DEFAULT_CONCURRENCY = 5;
/** How many people may share one role when parallel work needs them (the original included). */
const DEFAULT_MAX_PER_ROLE = 3;
/** Names for teammates added for parallel work. */
const TEAMMATE_NAMES = ['Iris', 'Theo', 'Nadia', 'Arjun', 'Lena', 'Felix', 'Maya', 'Yusuf', 'Clara', 'Hugo', 'Aisha', 'Mateo', 'Sana', 'Eli', 'Rhea', 'Jonas'];

function isExecutiveRole(role: string): boolean {
  return /\b(chief|ceo|cto|cfo|cpo|ciso|cdo|coo|head of|vp)\b/i.test(role);
}
