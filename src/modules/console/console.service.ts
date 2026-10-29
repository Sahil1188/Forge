import { briefForEmployee } from '../employees/employee-briefs';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, stat } from 'node:fs/promises';
import * as path from 'node:path';
import { and, desc, eq, gte, inArray, ne, sql } from 'drizzle-orm';
import { DRIZZLE, Database } from '../../infrastructure/database/drizzle.provider';
import { CompaniesService } from '../companies/companies.service';
import { EmployeesService } from '../employees/employees.service';
import { employees } from '../employees/employees.schema';
import { GoalsService } from '../goals/goals.service';
import { goals } from '../goals/goals.schema';
import { projects } from '../projects/projects.schema';
import { workItems, workDependencies } from '../work/work.schema';
import { WorkService } from '../work/work.service';
import { agentRuns, AgentRun } from '../runtimes/agent-runs.schema';
import { AgentRunsService } from '../runtimes/agent-runs.service';
import { RuntimeAvailability } from '../runtimes/runtime-availability';
import { UsageLimits, fallbackSelection } from '../runtimes/usage-limits';
import { defaultProjectsRoot } from '../projects/project-location';
import { evaluations } from '../evaluation/evaluation.schema';
import { approvals } from '../approvals/approvals.schema';
import { costEvents } from '../budgets/budgets.schema';
import { WORKSPACE_PORT, WorkspacePort } from '../workspaces/workspace.port';
import { WORKFORCE_ROUTER, WorkforceRouterPort } from '../routing/workforce/workforce-router.port';
import { ReputationService } from '../performance/reputation.service';
import { FULL_ORG, modelPolicyFor } from './org-template';
import { inferTaskType } from '../work/domains';

const git = promisify(execFile);
const MAX_FILE_BYTES = 256 * 1024;
const MAX_DOWNLOAD_BYTES = 50 * 1024 * 1024;
const MAX_TRANSCRIPT_EVENTS = 2000;

export function runSummary(run: AgentRun) {
  return {
    id: run.id,
    status: run.status,
    runtimeKey: run.runtimeKey,
    model: run.model,
    employeeId: run.employeeId,
    durationMs: run.durationMs,
    toolCallCount: run.toolCallCount,
    filesChangedCount: run.filesChangedCount,
    estimatedCostUsd: run.estimatedCostUsd,
    error: (run.errorJson as { message?: string } | null)?.message ?? null,
    startedAt: run.startedAt,
    endedAt: run.endedAt,
  };
}

/** What a running agent is doing right now, read from its live transcript. */
export interface LiveActivity {
  actions: number;
  last: string | null;
  lastAt: string | null;
}

/** Drops the agent's private workspace prefix so paths read as project paths (apps/web/src/...). */
function relativeToRun(text: string): string {
  return text.replace(/(?:[A-Za-z]:)?[\\/][^\s'"]*?workspaces[\\/]runs[\\/][0-9a-f-]{36}[\\/]?/gi, '');
}

/** Summarises a live transcript: how many actions so far, and the latest thing the agent did. */
export function summariseLive(raw: string): LiveActivity {
  let actions = 0;
  let last: string | null = null;
  let lastAt: string | null = null;
  for (const line of raw.split('\n')) {
    if (!line) continue;
    let e: { kind?: string; toolName?: string; input?: Record<string, unknown>; text?: string; at?: string };
    try {
      e = JSON.parse(line);
    } catch {
      continue;
    }
    if (e.at) lastAt = e.at;
    if (e.kind === 'tool_use') {
      actions += 1;
      const input = e.input ?? {};
      const target = input.command ?? input.file_path ?? input.path ?? input.pattern ?? input.url ?? input.description;
      last = target ? `${e.toolName}: ${relativeToRun(String(target)).replace(/\s+/g, ' ').slice(0, 140)}` : (e.toolName ?? 'tool');
    } else if (e.kind === 'assistant_text' && e.text?.trim()) {
      last = e.text.trim().replace(/\s+/g, ' ').slice(0, 160);
    }
  }
  return { actions, last, lastAt };
}

/**
 * Read models and small commands shaped for the web console: each screen gets what it needs
 * in one request, so the UI stays a thin, fast layer over the domain services.
 */
@Injectable()
export class ConsoleService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly companies: CompaniesService,
    private readonly employeesSvc: EmployeesService,
    private readonly goalsSvc: GoalsService,
    private readonly work: WorkService,
    private readonly agentRuns: AgentRunsService,
    private readonly availability: RuntimeAvailability,
    @Inject(WORKSPACE_PORT) private readonly workspace: WorkspacePort,
    @Inject(WORKFORCE_ROUTER) private readonly router: WorkforceRouterPort,
    private readonly reputation: ReputationService,
    private readonly usageLimits: UsageLimits,
  ) {}

  /** Company home: headline numbers, recent goals with progress, and the team at a glance. */
  async dashboard(companyId: string) {
    const company = await this.companies.findOne(companyId);
    const team = await this.team(companyId);
    const goalRows = await this.db
      .select()
      .from(goals)
      .where(eq(goals.companyId, companyId))
      .orderBy(desc(goals.createdAt))
      .limit(50);
    const progress = await this.goalProgress(goalRows.map((g) => g.id));

    const ids = team.map((e) => e.id);
    const spend = async (since?: Date) => {
      if (ids.length === 0) return 0;
      const [row] = await this.db
        .select({ total: sql<number>`coalesce(sum(${costEvents.costUsd}), 0)` })
        .from(costEvents)
        .where(and(inArray(costEvents.employeeId, ids), since ? gte(costEvents.createdAt, since) : undefined));
      return Number(row?.total ?? 0);
    };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pending = await this.pendingApprovals(companyId);
    const [successRate, activity, attention] = await Promise.all([
      this.successRate(companyId),
      this.activity(companyId),
      this.needsAttention(companyId, pending),
    ]);

    return {
      company,
      stats: {
        employees: team.length,
        activeGoals: goalRows.filter((g) => g.status === 'active').length,
        completedGoals: goalRows.filter((g) => g.status === 'completed').length,
        pendingApprovals: pending.length,
        spendTodayUsd: await spend(today),
        spendTotalUsd: await spend(),
      },
      goals: goalRows.map((g) => ({
        id: g.id,
        title: g.title,
        status: g.status,
        mode: g.mode,
        createdAt: g.createdAt,
        ...(progress.get(g.id) ?? emptyProgress()),
      })),
      team,
      successRate,
      activity,
      needsAttention: attention,
    };
  }

  /** The roster with everything the team screen shows (runtime, skills, governance, last run). */
  async team(companyId: string) {
    const roster = await this.employeesSvc.findByCompany(companyId);
    const out = [];
    for (const base of roster) {
      const full = await this.employeesSvc.findOne(base.id);
      const [latest] = await this.agentRuns.findByEmployee(base.id, 1);
      out.push({
        id: full.id,
        name: full.name,
        role: full.role,
        department: full.department,
        description: full.description,
        status: full.status,
        managerEmployeeId: full.managerEmployeeId,
        governance: full.governance,
        runtimeConfig: full.runtimeConfig,
        skills: full.skills.map((s) => ({ skillKey: s.skillKey, level: s.level })),
        reputation: (await this.reputation.compute(full.id)).overall,
        latestRun: latest ? runSummary(latest) : null,
      });
    }
    return out;
  }

  /** Everything about one goal: plan, items in run order, who did what, evaluations, cost, deliverable. */
  async board(goalId: string) {
    const goal = await this.goalsSvc.findOne(goalId);
    const projectRows = await this.db.select().from(projects).where(eq(projects.goalId, goalId));
    const projectIds = projectRows.map((p) => p.id);
    const items = projectIds.length
      ? await this.db.select().from(workItems).where(inArray(workItems.projectId, projectIds)).orderBy(workItems.createdAt)
      : [];
    const itemIds = items.map((i) => i.id);

    const [deps, runs, evals, pending, roster] = await Promise.all([
      itemIds.length ? this.db.select().from(workDependencies).where(inArray(workDependencies.workItemId, itemIds)) : [],
      itemIds.length
        ? this.db.select().from(agentRuns).where(inArray(agentRuns.workItemId, itemIds)).orderBy(agentRuns.createdAt)
        : [],
      itemIds.length
        ? this.db.select().from(evaluations).where(inArray(evaluations.workItemId, itemIds)).orderBy(desc(evaluations.createdAt))
        : [],
      itemIds.length
        ? this.db
            .select()
            .from(approvals)
            .where(and(inArray(approvals.workItemId, itemIds), eq(approvals.status, 'pending')))
        : [],
      this.employeesSvc.findByCompany(goal.companyId),
    ]);
    const people = new Map(roster.map((e) => [e.id, { id: e.id, name: e.name, role: e.role }]));
    const [ceoRun] = await this.db.select().from(agentRuns).where(eq(agentRuns.goalId, goalId)).orderBy(desc(agentRuns.createdAt)).limit(1);

    const live = await this.liveActivity(runs);

    const boardItems = items.map((item) => {
      const itemRuns = runs.filter((r) => r.workItemId === item.id);
      const latestEval = evals.find((e) => e.workItemId === item.id);
      const dims = ((latestEval?.detail as { dimensions?: Record<string, Record<string, unknown>> })?.dimensions ?? {});
      return {
        id: item.id,
        projectId: item.projectId,
        title: item.title,
        description: item.description,
        taskType: item.taskType,
        status: item.status,
        acceptance: item.acceptance ?? [],
        assignee: item.assignedEmployeeId ? people.get(item.assignedEmployeeId) ?? null : null,
        dependsOn: deps.filter((d) => d.workItemId === item.id).map((d) => d.dependsOnWorkItemId),
        runs: itemRuns.map((r) => ({ ...runSummary(r), live: live.get(r.id) ?? null })),
        costUsd: itemRuns.reduce((a, r) => a + (r.estimatedCostUsd ?? 0), 0),
        evaluation: latestEval
          ? {
              status: latestEval.status,
              score: latestEval.overallScore,
              note: (latestEval.detail as { note?: string }).note ?? null,
              dimensions: Object.entries(dims).map(([name, d]) => ({
                name,
                score: d.score as number,
                ran: d.ran !== false,
                command: d.command as string,
                output: String(d.output ?? '').slice(-1500),
              })),
            }
          : null,
        pendingApprovals: pending
          .filter((a) => a.workItemId === item.id)
          .map((a) => ({ id: a.id, toolName: a.toolName, requestedAction: a.requestedAction, createdAt: a.createdAt })),
      };
    });

    const ceoCost = ceoRun?.estimatedCostUsd ?? 0;
    return {
      goal,
      planningRun: ceoRun ? runSummary(ceoRun) : null,
      projects: await Promise.all(
        projectRows.map(async (p) => ({ id: p.id, name: p.name, deliverablePath: await this.workspace.projectPath(p.id) })),
      ),
      items: boardItems,
      totals: {
        items: boardItems.length,
        done: boardItems.filter((i) => i.status === 'done').length,
        failed: boardItems.filter((i) => i.status === 'failed').length,
        running: boardItems.filter((i) => ['in_progress', 'evaluating'].includes(i.status)).length,
        costUsd: boardItems.reduce((a, i) => a + i.costUsd, 0) + ceoCost,
      },
    };
  }

  /** Approvals waiting for a human, newest first, with enough context to decide. */
  async pendingApprovals(companyId: string) {
    return this.approvals(companyId, 'pending');
  }

  /** Approvals for a company: `pending` (the inbox) or `decided` (history, newest first). */
  async approvals(companyId: string, which: 'pending' | 'decided' = 'pending') {
    const rows = await this.db
      .select({
        id: approvals.id,
        toolName: approvals.toolName,
        requestedAction: approvals.requestedAction,
        createdAt: approvals.createdAt,
        status: approvals.status,
        decidedAt: approvals.decidedAt,
        agentRunId: approvals.agentRunId,
        workItemId: approvals.workItemId,
        workItemTitle: workItems.title,
        employeeId: approvals.employeeId,
        employeeName: employees.name,
      })
      .from(approvals)
      .innerJoin(employees, eq(employees.id, approvals.employeeId))
      .innerJoin(workItems, eq(workItems.id, approvals.workItemId))
      .where(
        and(
          eq(employees.companyId, companyId),
          which === 'pending' ? eq(approvals.status, 'pending') : ne(approvals.status, 'pending'),
        ),
      )
      .orderBy(desc(which === 'pending' ? approvals.createdAt : approvals.decidedAt))
      .limit(200);
    const goalByProject = await this.goalIdsForItems(rows.map((r) => r.workItemId));
    return rows.map((r) => ({ ...r, goalId: goalByProject.get(r.workItemId) ?? null }));
  }

  /** Live activity of the runs that are still going (read from their streaming transcripts). */
  private async liveActivity(runs: AgentRun[]): Promise<Map<string, LiveActivity>> {
    const active = runs.filter((r) => r.status === 'running' && r.transcriptRef);
    const out = new Map<string, LiveActivity>();
    await Promise.all(
      active.map(async (r) => {
        try {
          out.set(r.id, summariseLive(await readFile(r.transcriptRef!, 'utf8')));
        } catch {
          // not written yet
        }
      }),
    );
    return out;
  }

  /** The redacted event stream of a run (what the agent did, step by step). */
  async transcript(runId: string) {
    const run = await this.agentRuns.findOne(runId);
    if (!run.transcriptRef) return { run: runSummary(run), events: [] };
    let raw = '';
    try {
      raw = await readFile(run.transcriptRef, 'utf8');
    } catch {
      return { run: runSummary(run), events: [] };
    }
    const events = raw
      .split('\n')
      .filter(Boolean)
      .slice(0, MAX_TRANSCRIPT_EVENTS)
      .map((line) => {
        try {
          return JSON.parse(line) as Record<string, unknown>;
        } catch {
          return { kind: 'unparseable', text: line.slice(0, 500) };
        }
      });
    return { run: runSummary(run), events };
  }

  /** Files of a project's integrated deliverable (`main`). */
  async files(projectId: string) {
    const root = await this.projectRoot(projectId);
    if (!root) return { projectId, path: await this.workspace.projectPath(projectId), files: [] };
    const { stdout } = await git('git', ['ls-files'], { cwd: root, windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
    const files = stdout.split('\n').map((f) => f.trim()).filter(Boolean).filter((f) => f !== '.gitignore');
    return { projectId, path: root, files };
  }

  /** One file from the deliverable — only files git tracks there, never arbitrary paths. */
  async file(projectId: string, filePath: string) {
    const listing = await this.files(projectId);
    if (!listing.files.includes(filePath)) {
      throw new NotFoundException(`No file '${filePath}' in this project`);
    }
    const abs = path.join(listing.path, filePath);
    const info = await stat(abs);
    if (info.size > MAX_FILE_BYTES) {
      return { path: filePath, size: info.size, truncated: true, binary: false, content: '' };
    }
    const buf = await readFile(abs);
    const binary = buf.subarray(0, 8000).includes(0);
    return { path: filePath, size: info.size, truncated: false, binary, content: binary ? '' : buf.toString('utf8') };
  }

  /**
   * "I don't like this": turns feedback on a delivered goal into one targeted change on the same
   * project. It goes to whoever built the part the feedback is about (else the best fit for its
   * domain), is told to change only what was asked, and must keep every earlier acceptance check and
   * the test suite passing — so fixing one thing cannot quietly break another.
   */
  async requestChanges(goalId: string, input: { feedback: string; workItemId?: string }) {
    const goal = await this.goalsSvc.findOne(goalId);
    const [project] = await this.db.select().from(projects).where(eq(projects.goalId, goalId)).orderBy(projects.createdAt).limit(1);
    if (!project) throw new BadRequestException('This goal has no delivered project yet. Start it first.');
    const items = await this.db.select().from(workItems).where(eq(workItems.projectId, project.id)).orderBy(workItems.createdAt);
    const target = input.workItemId ? items.find((i) => i.id === input.workItemId) : undefined;
    if (input.workItemId && !target) throw new NotFoundException('That step is not part of this goal.');

    const feedback = input.feedback.trim();
    // Regression guard: everything that was required before is still required.
    const regression = [...new Set(items.filter((i) => i.status !== 'cancelled').flatMap((i) => i.acceptance ?? []))].slice(0, 20);
    const item = await this.work.createWorkItem(project.id, {
      title: `Change request: ${feedback.replace(/\s+/g, ' ').slice(0, 120)}`,
      description: [
        'The person who asked for this work reviewed it and wants a change:',
        '',
        feedback,
        '',
        target ? `This is about the step "${target.title}".` : '',
        'Find the cause in the existing project and change only what is needed for this request.',
        'Do not rewrite, restyle or reorganise unrelated code or files, and do not remove features.',
        'Every existing test and acceptance check must still pass afterwards; add a test that proves the change.',
      ]
        .filter((l) => l !== null)
        .join('\n'),
      taskType: target?.taskType ?? inferTaskType(feedback),
      acceptance: regression,
    });
    // Runs after anything still in flight, so it builds on the latest state of the project.
    for (const other of items.filter((i) => !['done', 'cancelled', 'failed'].includes(i.status))) {
      await this.work.addDependency(item.id, { dependsOnWorkItemId: other.id });
    }
    const builder = target?.assignedEmployeeId ?? null;
    const decision = builder ? { employeeId: builder } : await this.router.route({ id: item.id, companyId: goal.companyId, taskType: item.taskType });
    if (!decision) throw new BadRequestException('Nobody in this company can take this change right now.');
    // Back in progress without re-planning: completion is re-evaluated when the change is done.
    if (goal.status === 'completed') await this.db.update(goals).set({ status: 'active' }).where(eq(goals.id, goalId));
    await this.work.assign(item.id, { employeeId: decision.employeeId, assignedBy: 'change_request' });
    return { workItemId: item.id, assignedTo: decision.employeeId, regressionChecks: regression.length };
  }

  /** A deliverable file's raw bytes for download (workbooks, PDFs, images…) — tracked files only. */
  async download(projectId: string, filePath: string): Promise<{ name: string; size: number; body: Buffer }> {
    const listing = await this.files(projectId);
    if (!listing.files.includes(filePath)) throw new NotFoundException(`No file '${filePath}' in this project`);
    const abs = path.join(listing.path, filePath);
    const info = await stat(abs);
    if (info.size > MAX_DOWNLOAD_BYTES) throw new BadRequestException('File is larger than 50 MB; open it from the project folder.');
    return { name: path.basename(filePath), size: info.size, body: await readFile(abs) };
  }

  /** Sends a failed (or stuck-in-rework) item back to work, re-routed to whoever can run it now. */
  async retry(workItemId: string) {
    const item = await this.work.findOne(workItemId);
    if (item.status !== 'failed' && item.status !== 'rework') {
      throw new BadRequestException(`Only failed or rework items can be retried (this one is ${item.status})`);
    }
    const decision = await this.router.route({ id: item.id, companyId: item.companyId, taskType: item.taskType });
    if (!decision) throw new BadRequestException('Nobody in this company can run this work right now');
    await this.work.assign(item.id, { employeeId: decision.employeeId, assignedBy: 'console_retry' });
    return { workItemId: item.id, assignedTo: decision.employeeId };
  }

  /** What this installation can run right now — for the console's status indicator and setup. */
  async system() {
    const [claudeCode, anthropicApi, ollama, fallbackApi] = await Promise.all([
      this.availability.check('claude_code'),
      this.availability.check('custom', 'anthropic'),
      this.availability.check('custom', 'ollama'),
      this.availability.check('custom', 'openai'),
    ]);
    return {
      version: process.env.npm_package_version ?? '0.1.0',
      autoRun: !process.env.FORGE_MANUAL_DRIVE,
      sandbox: (process.env.FORGE_SANDBOX ?? 'host').toLowerCase(),
      // Latest subscription usage-limit state per runtime (status, resetsAt epoch ms, window, utilization).
      usage: this.usageLimits.snapshot(),
      // Isolation of the agents' own shell commands (Claude Code sandbox). Native Windows sessions
      // currently can't sandbox (verified live: "feature gate off"), so say so instead of implying safety.
      agentSandbox: agentSandboxStatus(),
      // Where new projects go unless a company or goal chooses another folder.
      projectsRoot: defaultProjectsRoot(),
      runtimes: [
        { key: 'claude_code', label: 'Claude Code (subscription)', ...claudeCode },
        { key: 'custom:anthropic', label: 'API workers', ...anthropicApi },
        { key: 'custom:ollama', label: 'Local models (Ollama)', ...ollama },
        { key: 'custom:openai', label: 'Fallback gateway (OmniRoute / OpenRouter)', ...fallbackApi },
      ],
      // Where work goes automatically while Claude is at its usage limit.
      fallback: fallbackSelection('claude_code')
        ? { model: process.env.FORGE_FALLBACK_MODEL, endpoint: new URL(process.env.FORGE_FALLBACK_BASE_URL as string).host }
        : null,
    };
  }

  /**
   * One click to a working organisation. 'full' (default): an executive per department plus senior
   * specialists (see org-template). 'minimal': a CEO who plans and an engineer who builds.
   * Passing a model pins everyone to it; otherwise planners get Opus and specialists
   * Sonnet, stepping up to Opus for complex work.
   */
  async starterTeam(companyId: string, model?: string, template: 'full' | 'minimal' = 'full') {
    await this.companies.findOne(companyId);
    const members = template === 'minimal' ? FULL_ORG.filter((m) => m.key === 'ceo' || m.key === 'backend') : FULL_ORG;
    const ids = new Map<string, string>();
    const created = [];
    for (const m of members) {
      const employee = await this.employeesSvc.create(companyId, {
        name: m.name,
        role: template === 'minimal' && m.key === 'backend' ? 'Software Engineer' : m.role,
        department: m.department,
        description: briefForEmployee(m)?.mission ?? m.description,
        managerEmployeeId: (m.reportsTo && (ids.get(m.reportsTo) ?? ids.get('ceo'))) || undefined,
        runtimeConfig: {
          runtimeKey: 'claude_code',
          modelPolicy: modelPolicyFor(m, model),
          settings: { maxTurns: m.executive ? 30 : m.key === 'reviewer' ? 150 : 100 },
        },
        skills: m.skills.map(([skillKey, level]) => ({ skillKey, level })),
      });
      ids.set(m.key, employee.id);
      created.push(employee);
    }
    return {
      ceo: created.find((e) => e.id === ids.get('ceo'))!,
      engineer: created.find((e) => e.id === ids.get('backend'))!,
      employees: created,
    };
  }

  /** Every agent run in the company (work items and planning), newest first. */
  async runs(companyId: string, limit = 200) {
    await this.companies.findOne(companyId);
    const rows = await this.db
      .select({ run: agentRuns, employeeName: employees.name })
      .from(agentRuns)
      .innerJoin(employees, eq(employees.id, agentRuns.employeeId))
      .where(eq(employees.companyId, companyId))
      .orderBy(desc(agentRuns.createdAt))
      .limit(limit);
    const itemIds = rows.map((r) => r.run.workItemId).filter((x): x is string => Boolean(x));
    const items = itemIds.length
      ? await this.db
          .select({ id: workItems.id, title: workItems.title, goalId: projects.goalId })
          .from(workItems)
          .innerJoin(projects, eq(projects.id, workItems.projectId))
          .where(inArray(workItems.id, itemIds))
      : [];
    const byItem = new Map(items.map((i) => [i.id, i]));
    const live = await this.liveActivity(rows.map((r) => r.run));
    return rows.map(({ run, employeeName }) => {
      const item = run.workItemId ? byItem.get(run.workItemId) : undefined;
      return {
        ...runSummary(run),
        live: live.get(run.id) ?? null,
        employeeName,
        kind: run.goalId && !run.workItemId ? 'planning' : 'work',
        workItemId: run.workItemId,
        workItemTitle: item?.title ?? null,
        goalId: item?.goalId ?? run.goalId ?? null,
      };
    });
  }

  /** One employee's recent runs. */
  async employeeRuns(employeeId: string) {
    await this.employeesSvc.findOne(employeeId);
    return (await this.agentRuns.findByEmployee(employeeId, 50)).map(runSummary);
  }

  /** Projects (deliverables) of a company, newest first, with progress and where they live. */
  async projects(companyId: string) {
    await this.companies.findOne(companyId);
    const rows = await this.db
      .select({ project: projects, goalTitle: goals.title, goalStatus: goals.status, goalId: goals.id })
      .from(projects)
      .innerJoin(goals, eq(goals.id, projects.goalId))
      .where(eq(projects.companyId, companyId))
      .orderBy(desc(projects.createdAt));
    const ids = rows.map((r) => r.project.id);
    const items = ids.length
      ? await this.db.select({ projectId: workItems.projectId, status: workItems.status }).from(workItems).where(inArray(workItems.projectId, ids))
      : [];
    return rows.map(({ project, goalTitle, goalStatus, goalId }) => {
      const mine = items.filter((i) => i.projectId === project.id && i.status !== 'cancelled');
      return {
        id: project.id,
        name: project.name,
        goalId,
        goalTitle,
        goalStatus,
        createdAt: project.createdAt,
        items: mine.length,
        done: mine.filter((i) => i.status === 'done').length,
        deliverablePath: project.repoPath ?? path.join(process.cwd(), 'workspaces', 'projects', project.id),
      };
    });
  }

  /** Share of evaluations that passed in the last 30 days (null when there are none). */
  private async successRate(companyId: string): Promise<number | null> {
    const since = new Date(Date.now() - 30 * 86_400_000);
    const rows = await this.db
      .select({ status: evaluations.status })
      .from(evaluations)
      .innerJoin(workItems, eq(workItems.id, evaluations.workItemId))
      .where(and(eq(workItems.companyId, companyId), gte(evaluations.createdAt, since)));
    const scored = rows.filter((r) => r.status !== 'inconclusive');
    if (scored.length === 0) return null;
    return Math.round((scored.filter((r) => r.status === 'passed').length / scored.length) * 1000) / 10;
  }

  /** Runs and spend per day for the last 7 days (oldest first, today last). */
  private async activity(companyId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);
    const rows = await this.db
      .select({ createdAt: agentRuns.createdAt, cost: agentRuns.estimatedCostUsd })
      .from(agentRuns)
      .innerJoin(employees, eq(employees.id, agentRuns.employeeId))
      .where(and(eq(employees.companyId, companyId), gte(agentRuns.createdAt, start)));
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return { date: d.toISOString().slice(0, 10), runs: 0, costUsd: 0, _t: d.getTime() };
    });
    for (const r of rows) {
      const idx = Math.floor((r.createdAt.getTime() - start.getTime()) / 86_400_000);
      if (idx >= 0 && idx < 7) {
        days[idx].runs += 1;
        days[idx].costUsd += r.cost ?? 0;
      }
    }
    return days.map(({ _t, ...d }) => d);
  }

  /** What a human should look at: approvals waiting, and work that failed or is being retried. */
  private async needsAttention(companyId: string, pending: Awaited<ReturnType<ConsoleService['approvals']>>) {
    const troubled = await this.db
      .select({ id: workItems.id, title: workItems.title, status: workItems.status, updatedAt: workItems.updatedAt, goalId: projects.goalId })
      .from(workItems)
      .innerJoin(projects, eq(projects.id, workItems.projectId))
      .where(and(eq(workItems.companyId, companyId), inArray(workItems.status, ['failed', 'rework'])))
      .orderBy(desc(workItems.updatedAt))
      .limit(10);
    return [
      ...pending.slice(0, 10).map((a) => ({
        kind: 'approval' as const,
        id: a.id,
        title: `${a.employeeName} wants to use ${a.toolName}`,
        detail: a.workItemTitle,
        goalId: a.goalId,
        at: a.createdAt,
      })),
      ...troubled.map((t) => ({
        kind: t.status === 'failed' ? ('failed' as const) : ('retrying' as const),
        id: t.id,
        title: t.title,
        detail: t.status === 'failed' ? 'Failed after all attempts' : 'Failed its checks — retrying',
        goalId: t.goalId,
        at: t.updatedAt,
      })),
    ];
  }

  private async projectRoot(projectId: string): Promise<string | null> {
    const [project] = await this.db.select({ id: projects.id }).from(projects).where(eq(projects.id, projectId));
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    const root = await this.workspace.projectPath(projectId);
    try {
      await stat(path.join(root, '.git'));
      return root;
    } catch {
      return null; // no work has started yet
    }
  }

  private async goalProgress(goalIds: string[]) {
    const out = new Map<string, ReturnType<typeof emptyProgress>>();
    if (goalIds.length === 0) return out;
    const rows = await this.db
      .select({ goalId: projects.goalId, status: workItems.status, id: workItems.id })
      .from(workItems)
      .innerJoin(projects, eq(projects.id, workItems.projectId))
      .where(inArray(projects.goalId, goalIds));
    const costRows = await this.db
      .select({ goalId: projects.goalId, cost: sql<number>`coalesce(sum(${agentRuns.estimatedCostUsd}), 0)` })
      .from(agentRuns)
      .innerJoin(workItems, eq(workItems.id, agentRuns.workItemId))
      .innerJoin(projects, eq(projects.id, workItems.projectId))
      .where(inArray(projects.goalId, goalIds))
      .groupBy(projects.goalId);
    const planCost = await this.db
      .select({ goalId: agentRuns.goalId, cost: sql<number>`coalesce(sum(${agentRuns.estimatedCostUsd}), 0)` })
      .from(agentRuns)
      .where(inArray(agentRuns.goalId, goalIds))
      .groupBy(agentRuns.goalId);
    for (const id of goalIds) out.set(id, emptyProgress());
    for (const r of rows) {
      const p = out.get(r.goalId)!;
      if (r.status === 'cancelled') continue;
      p.items += 1;
      if (r.status === 'done') p.done += 1;
      if (r.status === 'failed') p.failed += 1;
      if (r.status === 'in_progress' || r.status === 'evaluating') p.running += 1;
      if (r.status === 'needs_approval') p.waiting += 1;
    }
    for (const c of [...costRows, ...planCost]) {
      if (c.goalId) out.get(c.goalId)!.costUsd += Number(c.cost);
    }
    return out;
  }

  private async goalIdsForItems(itemIds: string[]) {
    if (itemIds.length === 0) return new Map<string, string>();
    const rows = await this.db
      .select({ id: workItems.id, goalId: projects.goalId })
      .from(workItems)
      .innerJoin(projects, eq(projects.id, workItems.projectId))
      .where(inArray(workItems.id, itemIds));
    return new Map(rows.map((r) => [r.id, r.goalId]));
  }
}

function emptyProgress() {
  return { items: 0, done: 0, failed: 0, running: 0, waiting: 0, costUsd: 0 };
}

/** What the agents' command sandbox will do on this installation, in plain words. */
export function agentSandboxStatus(mode = (process.env.FORGE_AGENT_SANDBOX ?? 'on').toLowerCase(), platform = process.platform) {
  const off = mode === 'off' || mode === 'false' || mode === '0';
  if (off) return { mode: 'off', protected: false, note: 'Agent commands run as your user with your permissions.' };
  if (platform === 'win32') {
    return {
      mode,
      protected: false,
      note:
        mode === 'required'
          ? 'Required, but Claude Code cannot sandbox on native Windows yet, so agent runs will refuse to start. Run Forge in WSL2 or Linux.'
          : 'Requested, but Claude Code cannot sandbox on native Windows yet: agent commands still run as your user. Run Forge in WSL2 or Linux for isolation.',
    };
  }
  return {
    mode,
    protected: true,
    note: mode === 'required' ? 'Agent commands always run sandboxed; runs refuse to start without it.' : 'Agent commands run sandboxed when the platform supports it (bubblewrap on Linux).',
  };
}
