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
import { AgentRunsService } from '../runtimes/agent-runs.service';
import { RuntimeRegistry } from '../runtimes/runtime-registry';
import { RuntimeRunContext } from '../runtimes/runtime.port';
import { confinementGate } from '../governance/path-confinement';
import { BudgetsService } from '../budgets/budgets.service';
import { WORKSPACE_PORT, WorkspacePort } from '../workspaces/workspace.port';
import { OMNI_ROUTER, OmniRouterPort } from '../routing/omni/omni-router.port';
import { WORKFORCE_ROUTER, WorkforceRouterPort } from '../routing/workforce/workforce-router.port';
import {
  attachGoalAcceptance,
  capPlan,
  MAX_TITLE,
  PlannedItem,
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

const VALID_TASK_TYPES: TaskType[] = ['architecture', 'coding', 'review', 'devops', 'qa', 'generic'];
const DEFAULT_MAX_PLAN_ITEMS = 3;

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

  async plan(goalId: string, ceo?: EmployeeWithRelations): Promise<PlanResult> {
    const goal = await this.goals.findOne(goalId);
    if (goal.mode === 'direct') {
      // Short task: no planning run at all — one work item straight to the best-fit employee.
      return this.materialize(
        goal,
        {
          project: goal.title.slice(0, 200),
          workItems: [{ title: goal.title.slice(0, MAX_TITLE), description: goal.description ?? undefined, taskType: 'coding' }],
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
        task: this.planningPrompt(goal),
        model: selection.model,
        systemPromptAppend: this.planningClaudeMd(planner.name, planner.role, goal),
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
    return this.materialize(goal, plan, run.id, `CEO ${planner.name}`);
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

    this.logger.log(`${plannedBy} planned goal ${goal.id}: ${workItems.length} work item(s) in project ${project.id}`);
    return { goalId: goal.id, ceoRunId, projectId: project.id, workItems };
  }

  private async readPlan(
    rootPath: string,
    goal: Goal,
  ): Promise<{ project: string; workItems: PlannedItem[] }> {
    try {
      const raw = await readFile(path.join(rootPath, 'PLAN.json'), 'utf8');
      const parsed = JSON.parse(raw) as { project?: unknown; workItems?: unknown } | null;
      // PLAN.json is model-written: trust nothing about its shape.
      const items = Array.isArray(parsed?.workItems) ? parsed!.workItems.flatMap(sanitizeItem) : [];
      if (items.length > 0) {
        const project =
          typeof parsed!.project === 'string' && parsed!.project.trim()
            ? parsed!.project.trim().slice(0, 200)
            : 'Delivery';
        return { project, workItems: items };
      }
    } catch {
      // fall through to a sensible default
    }
    // Resilient fallback: always yield at least one work item.
    return {
      project: 'Delivery',
      workItems: [{ title: `Deliver: ${goal.title}`.slice(0, MAX_TITLE), description: goal.description ?? undefined, taskType: 'coding' }],
    };
  }

  private coerceTaskType(value?: string): TaskType {
    return VALID_TASK_TYPES.includes(value as TaskType) ? (value as TaskType) : 'coding';
  }

  private planningPrompt(goal: Goal): string {
    return [
      `Goal: ${goal.title}`,
      goal.description ?? '',
      '',
      'As the CEO, break this goal into concrete engineering work items.',
      'All items work in ONE shared repository and run in the order you list them (each starts',
      'from the result of the previous ones). Prefer few, substantial items; a small goal can be a',
      'single item. Every item must leave the project working: if it defines npm build/test/lint',
      'scripts they must pass after that item — so never split "add a test script" from the code',
      'and tests it runs. Make each description self-contained and specific.',
      `Use at most ${process.env.FORGE_MAX_PLAN_ITEMS ?? DEFAULT_MAX_PLAN_ITEMS} items; do not add separate "initialise project" or "verify" items —`,
      'set-up and verification belong inside the items that need them.',
      'For each item give "acceptance": shell commands that must exit 0 when the item is truly done',
      'according to the goal (e.g. the exact file layout and exported names the goal asks for).',
      'Write them with `node -e "…"` so they run on any OS, and keep them fast.',
      'Write a file named PLAN.json in the current working directory with the shape:',
      '{ "project": string, "workItems": [ { "title": string, "description": string, "taskType": "coding"|"architecture"|"devops"|"qa"|"review", "acceptance": string[], "dependsOn"?: number[] } ] }',
      'dependsOn is optional: 0-based indices of earlier items; omit it to depend on the previous item.',
    ].join('\n');
  }

  private planningClaudeMd(name: string, role: string, goal: Goal): string {
    return [
      `# ${name} — ${role}`,
      '',
      'You are the CEO of an AI company (Forge). Plan strategically and delegate.',
      `Current goal: ${goal.title}`,
      '',
    ].join('\n');
  }
}
