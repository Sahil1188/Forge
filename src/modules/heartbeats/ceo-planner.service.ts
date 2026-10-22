import { Inject, Injectable, Logger } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import * as path from 'node:path';
import { GoalsService } from '../goals/goals.service';
import { Goal } from '../goals/goals.schema';
import { EmployeesService } from '../employees/employees.service';
import { EmployeeWithRelations } from '../employees/employees.schema';
import { ProjectsService } from '../projects/projects.service';
import { WorkService } from '../work/work.service';
import { TaskType } from '../work/work.schema';
import { DOMAINS, TASK_TYPES, domainOf, inferTaskType, isTaskType } from '../work/domains';
import { isExecutive } from '../routing/workforce/candidate-scoring';
import { AgentRunsService } from '../runtimes/agent-runs.service';
import { RuntimeRegistry } from '../runtimes/runtime-registry';
import { RuntimeRunContext } from '../runtimes/runtime.port';
import { confinementGate } from '../governance/path-confinement';
import { BudgetsService } from '../budgets/budgets.service';
import { UsageLimits } from '../runtimes/usage-limits';
import { standardsFor } from '../work/standards';
import { WORKSPACE_PORT, WorkspacePort } from '../workspaces/workspace.port';
import { OMNI_ROUTER, OmniRouterPort } from '../routing/omni/omni-router.port';
import { WORKFORCE_ROUTER, WorkforceRouterPort } from '../routing/workforce/workforce-router.port';
import {
  attachGoalAcceptance,
  capPlan,
  MAX_TITLE,
  PlannedHire,
  PlannedItem,
  sanitizeHire,
  resolveDependencies,
  sanitizeItem,
} from './plan-shaping';

export interface PlanResult {
  goalId: string;
  /** The CEO's planning run; null for a `direct` goal (no planning needed). */
  ceoRunId: string | null;
  projectId: string;
  workItems: { workItemId: string; title: string; assignedTo: string | null }[];
}

const DEFAULT_MAX_PLAN_ITEMS = 3;
const DEFAULT_MAX_HIRES = 2;

/**
 * Runs a CEO/lead employee to break a goal into work items (spec §27 steps 5-6).
 * The CEO writes PLAN.json into its workspace; Forge parses it, creates the work
 * graph, and routes each item to the best-fit employee via the Workforce Router.
 */
@Injectable()
export class CeoPlanner {
  private readonly logger = new Logger(CeoPlanner.name);

  constructor(
    private readonly goals: GoalsService,
    private readonly employees: EmployeesService,
    private readonly projects: ProjectsService,
    private readonly work: WorkService,
    private readonly agentRuns: AgentRunsService,
    private readonly registry: RuntimeRegistry,
    @Inject(WORKSPACE_PORT) private readonly workspace: WorkspacePort,
    @Inject(OMNI_ROUTER) private readonly omni: OmniRouterPort,
    @Inject(WORKFORCE_ROUTER) private readonly router: WorkforceRouterPort,
    private readonly budgets: BudgetsService,
    private readonly usageLimits: UsageLimits,
  ) {}

  /** Finds the planning employee for a company (CEO by role, else the top of the org). */
  async findCeo(companyId: string): Promise<EmployeeWithRelations | null> {
    const roster = await this.employees.findByCompany(companyId);
    const ceoBase =
      roster.find((e) => /ceo|chief/i.test(e.role)) ??
      roster.find((e) => !e.managerEmployeeId) ??
      roster[0];
    return ceoBase ? this.employees.findOne(ceoBase.id) : null;
  }

  /**
   * Who plans a goal: the executive heading the department that owns the goal's domain (a finance
   * model goes to the CFO, a security review to the CISO), falling back to the CEO. Only executives plan; specialists do the work.
   */
  async findPlanner(goal: Goal): Promise<EmployeeWithRelations | null> {
    const department = domainOf(inferTaskType(`${goal.title} ${goal.description ?? ''}`)).department.toLowerCase();
    const roster = await this.employees.findByCompany(goal.companyId);
    const head = roster.find(
      (e) => isExecutive(e.role) && !/\bceo\b/i.test(e.role) && (e.department ?? '').toLowerCase() === department,
    );
    return head ? this.employees.findOne(head.id) : this.findCeo(goal.companyId);
  }

  async plan(goalId: string, ceo?: EmployeeWithRelations): Promise<PlanResult> {
    const goal = await this.goals.findOne(goalId);
    if (goal.mode === 'direct') {
      // Short task: no planning run at all — one work item straight to the best-fit employee.
      return this.materialize(
        goal,
        {
          project: goal.title.slice(0, 200),
          workItems: [{ title: goal.title.slice(0, MAX_TITLE), description: goal.description ?? undefined, taskType: inferTaskType(`${goal.title} ${goal.description ?? ''}`) }],
        },
        null,
        'direct',
      );
    }
    const planner = ceo ?? (await this.findCeo(goal.companyId));
    if (!planner) {
      throw new Error(`No CEO/lead employee found for company ${goal.companyId}`);
    }

    // Planning is spend like any other: a CEO over budget does not get to plan (spec §21).
    const budget = await this.budgets.check(planner.id);
    if (budget.state !== 'ok') {
      throw new Error(
        `CEO ${planner.name} is over budget (${budget.state}, $${budget.spend.toFixed(4)}); not planning goal ${goalId}`,
      );
    }

    const selection = this.omni.selectModel({ taskType: 'architecture' }, planner);
    const run = await this.agentRuns.create({
      goalId,
      employeeId: planner.id,
      runtimeKey: selection.runtimeKey,
      provider: selection.provider,
      model: selection.model,
    });

    let rootPath: string;
    try {
      const handle = await this.workspace.prepare({ employeeId: planner.id, goalId });
      rootPath = handle.rootPath;
      await this.agentRuns.attachWorkspace(run.id, handle.id);

      const ctx: RuntimeRunContext = {
        workItemId: `plan:${goalId}`,
        employeeId: planner.id,
        cwd: handle.rootPath,
        task: this.planningPrompt(goal, await this.employees.findByCompany(goal.companyId)),
        model: selection.model,
        systemPromptAppend: this.planningClaudeMd(planner, goal),
        limits: { maxTurns: 30 },
        // The planner has no per-tool policy, but it must still stay in its workspace.
        canUseTool: confinementGate(handle.rootPath),
      };

      let completed = false;
      let failedError: string | undefined;
      let sessionId: string | undefined;
      let inputTokens = 0;
      let outputTokens = 0;
      let costUsd = 0;
      let toolCalls = 0;
      for await (const event of this.registry.get(selection.runtimeKey).run(ctx)) {
        if (event.kind === 'session') sessionId = event.sessionId;
        else if (event.kind === 'tool_use') toolCalls += 1;
        else if (event.kind === 'usage') {
          inputTokens += event.inputTokens;
          outputTokens += event.outputTokens;
          costUsd += event.costUsd;
          await this.budgets.recordCost(run.id, planner.id, {
            inputTokens: event.inputTokens,
            outputTokens: event.outputTokens,
            costUsd: event.costUsd,
          });
        } else if (event.kind === 'completed') {
          completed = true;
          if (event.sessionId) sessionId = event.sessionId;
        } else if (event.kind === 'failed') {
          failedError = event.error;
        } else if (event.kind === 'rate_limit') {
          this.usageLimits.record(selection.runtimeKey, event);
          if (event.status === 'rejected') failedError = 'Claude usage limit reached; plan again after it resets';
        }
      }

      const collected = await this.workspace.collect(handle);
      await this.agentRuns.finish(run.id, {
        status: completed ? 'completed' : 'failed',
        sessionId,
        inputTokens,
        outputTokens,
        estimatedCostUsd: costUsd,
        toolCallCount: toolCalls,
        filesChangedCount: collected.filesChanged.length,
        error: completed ? undefined : (failedError ?? 'planning run ended without completing'),
      });
      if (!completed) {
        // Don't invent work from a planning run that never finished.
        throw new Error(`CEO planning run failed for goal ${goalId}: ${failedError ?? 'no completion'}`);
      }
    } catch (err) {
      // Whatever went wrong, the run must not be left "running" forever.
      const current = await this.agentRuns.findOne(run.id);
      if (current.status === 'running') {
        await this.agentRuns.finish(run.id, { status: 'failed', error: (err as Error).message });
      }
      throw err;
    }

    const plan = await this.readPlan(rootPath, goal);
    // New specialists join before routing, so the work can go straight to them.
    await this.hire(goal, planner, plan.hires);
    return this.materialize(goal, plan, run.id, `${planner.role} ${planner.name}`);
  }

  /**
   * Turns a plan into the work graph: caps its size, attaches the goal's acceptance checks to
   * the final item, creates every item, wires the run order, and only then routes + assigns
   * (assigning emits work.assigned, and nothing may become runnable before its dependencies exist).
   */
  private async materialize(
    goal: Goal,
    plan: { project: string; workItems: PlannedItem[] },
    ceoRunId: string | null,
    plannedBy: string,
  ): Promise<PlanResult> {
    const max = Number(process.env.FORGE_MAX_PLAN_ITEMS ?? DEFAULT_MAX_PLAN_ITEMS);
    const capped = capPlan(plan.workItems, Number.isFinite(max) ? max : DEFAULT_MAX_PLAN_ITEMS);
    const shaped = attachGoalAcceptance(capped, resolveDependencies(capped), goal.acceptance ?? []);

    const project = await this.projects.create(goal.id, { name: plan.project });
    const created = [];
    for (const planned of shaped.items) {
      created.push(
        await this.work.createWorkItem(project.id, {
          title: planned.title,
          description: planned.description,
          taskType: this.coerceTaskType(planned.taskType),
          acceptance: planned.acceptance,
        }),
      );
    }
    for (const [i, deps] of shaped.deps.entries()) {
      for (const d of deps) {
        await this.work.addDependency(created[i].id, { dependsOnWorkItemId: created[d].id });
      }
    }

    const workItems: PlanResult['workItems'] = [];
    for (const item of created) {
      const decision = await this.router.route({
        id: item.id,
        companyId: goal.companyId,
        taskType: item.taskType,
      });
      if (decision) {
        await this.work.assign(item.id, {
          employeeId: decision.employeeId,
          assignedBy: ceoRunId ? 'ceo_plan' : 'direct',
        });
      }
      workItems.push({ workItemId: item.id, title: item.title, assignedTo: decision?.employeeId ?? null });
    }

    const review = await this.addProductionReview(goal, project.id, created, workItems);
    if (review) workItems.push(review);

    this.logger.log(`${plannedBy} planned goal ${goal.id}: ${workItems.length} work item(s) in project ${project.id}`);
    return { goalId: goal.id, ceoRunId, projectId: project.id, workItems };
  }

  /**
   * The last step of every goal: an independent senior review against the production standard. The
   * reviewer is never the builder (engineering work goes to the review specialists, business work to
   * another senior in that department), fixes what falls short, and must keep every check passing.
   * FORGE_PRODUCTION_REVIEW=0 turns it off.
   */
  private async addProductionReview(
    goal: Goal,
    projectId: string,
    built: Array<{ id: string; taskType: string; acceptance?: string[] | null }>,
    assigned: PlanResult['workItems'],
  ): Promise<PlanResult['workItems'][number] | null> {
    if (process.env.FORGE_PRODUCTION_REVIEW === '0' || built.length === 0) return null;
    const primary = built[0].taskType;
    const engineering = ['coding', 'frontend', 'qa', 'devops', 'cloud', 'network', 'data', 'security', 'architecture', 'review', 'generic'];
    const taskType: TaskType = engineering.includes(primary) ? 'review' : this.coerceTaskType(primary);
    const regression = [...new Set(built.flatMap((i) => i.acceptance ?? []))].slice(0, 20);
    const item = await this.work.createWorkItem(projectId, {
      title: 'Production review and hardening',
      description: [
        `Review the whole project for "${goal.title}" as an independent senior reviewer, as if it ships to paying customers today.`,
        'Check it against every point below, then fix each gap yourself (do not just report it):',
        ...standardsFor(primary).map((s) => `- ${s}`),
        '',
        'Run it the way a user would and look for anything broken, confusing or unfinished.',
        'Keep the scope: improve quality, do not add unrequested features or rewrite working code for taste.',
        'Every existing test and acceptance check must still pass. Finish with REVIEW.md: what you checked, what you fixed, anything left.',
      ].join('\n'),
      taskType,
      acceptance: regression,
    });
    for (const b of built) await this.work.addDependency(item.id, { dependsOnWorkItemId: b.id });
    const builders = assigned.map((a) => a.assignedTo).filter((x): x is string => Boolean(x));
    const decision = await this.router.route({ id: item.id, companyId: goal.companyId, taskType, excludeEmployeeIds: builders });
    if (decision) await this.work.assign(item.id, { employeeId: decision.employeeId, assignedBy: 'production_review' });
    return { workItemId: item.id, title: item.title, assignedTo: decision?.employeeId ?? null };
  }

  private async readPlan(
    rootPath: string,
    goal: Goal,
  ): Promise<{ project: string; workItems: PlannedItem[]; hires: PlannedHire[] }> {
    try {
      const raw = await readFile(path.join(rootPath, 'PLAN.json'), 'utf8');
      const parsed = JSON.parse(raw) as { project?: unknown; workItems?: unknown; hires?: unknown } | null;
      // PLAN.json is model-written: trust nothing about its shape.
      const items = Array.isArray(parsed?.workItems) ? parsed!.workItems.flatMap(sanitizeItem) : [];
      if (items.length > 0) {
        const project =
          typeof parsed!.project === 'string' && parsed!.project.trim()
            ? parsed!.project.trim().slice(0, 200)
            : 'Delivery';
        const hires = Array.isArray(parsed!.hires) ? parsed!.hires.flatMap(sanitizeHire) : [];
        return { project, workItems: items, hires };
      }
    } catch {
      // fall through to a sensible default
    }
    // Resilient fallback: always yield at least one work item.
    return {
      project: 'Delivery',
      workItems: [{ title: `Deliver: ${goal.title}`.slice(0, MAX_TITLE), description: goal.description ?? undefined, taskType: 'coding' }],
      hires: [],
    };
  }

  /**
   * Adds the specialists the planning executive asked for (PLAN.json "hires"), reporting to them.
   * Bounded per goal (FORGE_MAX_HIRES_PER_GOAL, default 2); a role the company already has is not
   * hired twice. New hires run on Sonnet, stepping up to Opus for complex work.
   */
  private async hire(goal: Goal, planner: EmployeeWithRelations, hires: PlannedHire[]): Promise<void> {
    const max = Number(process.env.FORGE_MAX_HIRES_PER_GOAL ?? DEFAULT_MAX_HIRES);
    if (!Number.isFinite(max) || max <= 0 || hires.length === 0) return;
    const roster = await this.employees.findByCompany(goal.companyId);
    const roles = new Set(roster.map((e) => e.role.toLowerCase()));
    let hired = 0;
    for (const h of hires) {
      if (hired >= max) break;
      if (roles.has(h.role.toLowerCase())) continue;
      const employee = await this.employees.create(goal.companyId, {
        name: h.name,
        role: h.role,
        department: h.department ?? planner.department ?? undefined,
        description: h.description ?? `${h.role}, hired by ${planner.name} for: ${goal.title}`.slice(0, 1000),
        managerEmployeeId: planner.id,
        runtimeConfig: {
          runtimeKey: 'claude_code',
          modelPolicy: { default: 'sonnet', byComplexity: { high: 'opus', low: 'sonnet' }, complexityThreshold: 0.8 },
          settings: { maxTurns: 60 },
        },
        skills: h.skills,
      });
      roles.add(h.role.toLowerCase());
      hired += 1;
      this.logger.log(`${planner.name} hired ${employee.name} (${employee.role}) for goal ${goal.id}`);
    }
  }

  private coerceTaskType(value?: string): TaskType {
    return isTaskType(value) ? value : 'coding';
  }

  private planningPrompt(goal: Goal, roster: Array<{ name: string; role: string; department: string | null }>): string {
    const max = process.env.FORGE_MAX_PLAN_ITEMS ?? DEFAULT_MAX_PLAN_ITEMS;
    const departments = new Map<string, string[]>();
    for (const e of roster) {
      const d = e.department || 'General';
      departments.set(d, [...(departments.get(d) ?? []), `${e.name} (${e.role})`]);
    }
    const org = [...departments].map(([d, people]) => `- ${d}: ${people.join(', ')}`);
    const domains = TASK_TYPES.filter((t) => t !== 'generic').map(
      (t) => `- ${t}${DOMAINS[t].department ? ` (${DOMAINS[t].department})` : ''}`,
    );
    return [
      `Goal: ${goal.title}`,
      goal.description ?? '',
      '',
      'You lead the planning for this goal. Break it into concrete work items and give each one to',
      'the domain that owns it; Forge routes every item to the best specialist in that domain.',
      '',
      'The organisation:',
      ...org,
      '',
      'Domains (use exactly one as each item\'s "taskType"):',
      ...domains,
      '',
      'All items work in ONE shared repository and run in the order you list them (each starts',
      'from the result of the previous ones). Deliver what the goal actually asks for, in the format',
      'a professional would hand over: production applications, documentation, Excel workbooks',
      '(.xlsx, generated by a script that is kept in the repo), Word/PDF reports, slide decks, CSV data,',
      'diagrams, infrastructure code. Every deliverable is a file in the repository, with a check',
      'that proves it is right (tests for code, a script that opens and validates a workbook, etc.).',
      'Prefer few, substantial items; a small goal can be a single item. Every item must leave the',
      'project working: if it defines npm build/test/lint scripts they must pass after that item,',
      'so never split "add a test script" from the code and tests it runs. Make each description',
      'self-contained and specific.',
      `Use at most ${max} items; do not add separate "initialise project" or "verify" items —`,
      'set-up and verification belong inside the items that need them.',
      'For each item give "acceptance": shell commands that must exit 0 when the item is truly done',
      'according to the goal (e.g. the exact file layout and exported names the goal asks for).',
      'Write them with `node -e "…"` so they run on any OS, and keep them fast.',
      'The final item must include at least one check that actually runs the deliverable the way a user',
      'would (start the CLI with sample input, import and call the library, run the generator and open its',
      'output), not only its unit tests. Servers must be started and stopped inside the check.',
      'If the work needs expertise nobody in the organisation has, you may hire up to',
      `${process.env.FORGE_MAX_HIRES_PER_GOAL ?? DEFAULT_MAX_HIRES} senior specialists in "hires" (name, role, department, a description of their`,
      'expertise, and skills with levels 85-98). Only hire when it is truly needed; the new people',
      'will report to you and can be given this goal\'s items.',
      'Write a file named PLAN.json in the current working directory with the shape:',
      `{ "project": string, "workItems": [ { "title": string, "description": string, "taskType": ${TASK_TYPES.filter((t) => t !== 'generic').map((t) => `"${t}"`).join('|')}, "acceptance": string[], "dependsOn"?: number[] } ], "hires"?: [ { "name": string, "role": string, "department": string, "description": string, "skills": [ { "skillKey": string, "level": number } ] } ] }`,
      'dependsOn is optional: 0-based indices of earlier items; omit it to depend on the previous item.',
    ].join('\n');
  }

  private planningClaudeMd(planner: EmployeeWithRelations, goal: Goal): string {
    return [
      `# ${planner.name} — ${planner.role}${planner.department ? `, ${planner.department}` : ''}`,
      '',
      planner.description ?? 'You lead an AI company (Forge). Plan strategically and delegate.',
      '',
      'You plan and delegate; specialists in each department do the work.',
      `Current goal: ${goal.title}`,
      '',
    ].join('\n');
  }
}
