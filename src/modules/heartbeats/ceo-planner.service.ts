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
import { WORKSPACE_PORT, WorkspacePort } from '../workspaces/workspace.port';
import { OMNI_ROUTER, OmniRouterPort } from '../routing/omni/omni-router.port';
import { WORKFORCE_ROUTER, WorkforceRouterPort } from '../routing/workforce/workforce-router.port';

interface PlannedItem {
  title: string;
  description?: string;
  taskType?: string;
}

export interface PlanResult {
  goalId: string;
  ceoRunId: string;
  projectId: string;
  workItems: { workItemId: string; assignedTo: string | null }[];
}

const VALID_TASK_TYPES: TaskType[] = ['architecture', 'coding', 'review', 'devops', 'qa', 'generic'];

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
    const planner = ceo ?? (await this.findCeo(goal.companyId));
    if (!planner) {
      throw new Error(`No CEO/lead employee found for company ${goal.companyId}`);
    }

    const selection = this.omni.selectModel({ taskType: 'architecture' }, planner);
    const run = await this.agentRuns.create({
      goalId,
      employeeId: planner.id,
      runtimeKey: selection.runtimeKey,
      provider: selection.provider,
      model: selection.model,
    });

    const handle = await this.workspace.prepare({ employeeId: planner.id, goalId });
    await this.agentRuns.attachWorkspace(run.id, handle.id);

    const ctx: RuntimeRunContext = {
      workItemId: `plan:${goalId}`,
      employeeId: planner.id,
      cwd: handle.rootPath,
      task: this.planningPrompt(goal),
      model: selection.model,
      systemPromptAppend: this.planningClaudeMd(planner.name, planner.role, goal),
      limits: { maxTurns: 30 },
    };

    let completed = false;
    let sessionId: string | undefined;
    let inputTokens = 0;
    let outputTokens = 0;
    let costUsd = 0;
    let toolCalls = 0;
    for await (const event of this.registry.get(selection.runtimeKey).run(ctx)) {
      if (event.kind === 'session') sessionId = event.sessionId;
      else if (event.kind === 'tool_use') toolCalls += 1;
      else if (event.kind === 'usage') {
        inputTokens = event.inputTokens;
        outputTokens = event.outputTokens;
        costUsd = event.costUsd;
      } else if (event.kind === 'completed') {
        completed = true;
        if (event.sessionId) sessionId = event.sessionId;
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
    });

    const plan = await this.readPlan(handle.rootPath, goal);
    const project = await this.projects.create(goal.id, { name: plan.project });

    const workItems: PlanResult['workItems'] = [];
    for (const planned of plan.workItems) {
      const item = await this.work.createWorkItem(project.id, {
        title: planned.title,
        description: planned.description,
        taskType: this.coerceTaskType(planned.taskType),
      });
      const decision = await this.router.route({
        id: item.id,
        companyId: goal.companyId,
        taskType: item.taskType,
      });
      if (decision) {
        await this.work.assign(item.id, {
          employeeId: decision.employeeId,
          assignedBy: 'ceo_plan',
        });
      }
      workItems.push({ workItemId: item.id, assignedTo: decision?.employeeId ?? null });
    }

    this.logger.log(
      `CEO ${planner.name} planned goal ${goalId}: ${workItems.length} work item(s) in project ${project.id}`,
    );
    return { goalId, ceoRunId: run.id, projectId: project.id, workItems };
  }

  private async readPlan(
    rootPath: string,
    goal: Goal,
  ): Promise<{ project: string; workItems: PlannedItem[] }> {
    try {
      const raw = await readFile(path.join(rootPath, 'PLAN.json'), 'utf8');
      const parsed = JSON.parse(raw) as { project?: string; workItems?: PlannedItem[] };
      if (Array.isArray(parsed.workItems) && parsed.workItems.length > 0) {
        return { project: parsed.project ?? 'Delivery', workItems: parsed.workItems };
      }
    } catch {
      // fall through to a sensible default
    }
    // Resilient fallback: always yield at least one work item.
    return {
      project: 'Delivery',
      workItems: [{ title: `Deliver: ${goal.title}`, taskType: 'coding' }],
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
      'Write a file named PLAN.json in the current working directory with the shape:',
      '{ "project": string, "workItems": [ { "title": string, "description": string, "taskType": "coding"|"architecture"|"devops"|"qa"|"review" } ] }',
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
