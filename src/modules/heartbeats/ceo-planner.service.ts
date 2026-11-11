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
import { UsageLimits, fallbackSelection } from '../runtimes/usage-limits';
import { standardsFor } from '../work/standards';
import { WORKSPACE_PORT, WorkspacePort } from '../workspaces/workspace.port';
import { CompaniesService } from '../companies/companies.service';
import { SHARED_RULES, briefForEmployee, renderBrief } from '../employees/employee-briefs';
import { Brand, fittingBrand, getBrand, listBrands } from '../brands/brand-library';
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

// Big goals split into right-sized parallel steps (e.g. one per screen); the production review is added on top.
const DEFAULT_MAX_PLAN_ITEMS = 12;
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
    private readonly companies: CompaniesService,
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

    let selection = this.omni.selectModel({ taskType: 'architecture' }, planner);
    // Claude at its usage limit: plan on the fallback endpoint (OmniRoute/OpenRouter…) if configured.
    if (this.usageLimits.blockedUntil(selection.runtimeKey) !== null) {
      const fallback = fallbackSelection(selection.runtimeKey);
      if (fallback) selection = fallback;
    }
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
        task: this.planningPrompt(goal, await this.employees.findByCompany(goal.companyId), await this.brandOptions(goal)),
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
    plan: { project: string; workItems: PlannedItem[]; brand?: string },
    ceoRunId: string | null,
    plannedBy: string,
  ): Promise<PlanResult> {
    const max = Number(process.env.FORGE_MAX_PLAN_ITEMS ?? DEFAULT_MAX_PLAN_ITEMS);
    const capped = capPlan(plan.workItems, Number.isFinite(max) ? max : DEFAULT_MAX_PLAN_ITEMS);
    const shaped = attachGoalAcceptance(capped, resolveDependencies(capped), goal.acceptance ?? []);

    const project = await this.projects.create(goal.id, { name: plan.project });
    await this.applyBrand(goal, project.id, plan.brand, shaped.items);
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
    // The planner already ended its plan with a review step: don't add a second one.
    if (built[built.length - 1].taskType === 'review') return null;
    const engineering = ['coding', 'frontend', 'design', 'qa', 'devops', 'cloud', 'network', 'data', 'security', 'architecture', 'review', 'generic'];
    // Anything with engineering or design in it is a product: the review specialists sign it off.
    // Pure business work (finance, legal, …) is reviewed by another senior of that department.
    const productWork = built.some((i) => engineering.includes(i.taskType));
    const primary = productWork ? (built.find((i) => i.taskType !== 'design')?.taskType ?? 'frontend') : built[0].taskType;
    const taskType: TaskType = productWork ? 'review' : this.coerceTaskType(primary);
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

  /** The brand block of the planning prompt: fixed by the user/company, or the list to choose from. */
  private async brandOptions(goal: Goal): Promise<string[]> {
    const company = await this.companies.findOne(goal.companyId).catch(() => null);
    const fixed = await getBrand(goal.brand ?? company?.brand ?? null);
    if (fixed) {
      return [`Brand: every user interface follows the ${fixed.name} brand (BRAND.md in the repository); it is already chosen, do not pick another.`];
    }
    const brands = await listBrands();
    if (brands.length === 0) return [];
    return [
      'Brands: every user interface Forge builds follows exactly one of these brand systems (the chosen one is put',
      'in the repository as BRAND.md with its exact CSS). If the goal has a user interface, set "brand" in PLAN.json',
      'to the id whose personality fits the product and its users best:',
      ...brands.map((b) => `- ${b.slug}: ${b.name}. ${b.metaphor} ${b.personality}`),
    ];
  }

  /**
   * Puts the goal's brand into the project as BRAND.md, so design, frontend and review all build to it.
   * Order of preference: the goal's brand, the company default, the planner's pick, then the brand that
   * fits the product. Only for work with a user interface (or when a brand was chosen explicitly).
   */
  private async applyBrand(goal: Goal, projectId: string, planBrand: string | undefined, items: PlannedItem[]): Promise<Brand | null> {
    try {
      const company = await this.companies.findOne(goal.companyId).catch(() => null);
      const explicit = goal.brand ?? company?.brand ?? null;
      const text = `${goal.title} ${goal.description ?? ''}`;
      const hasUi =
        items.some((i) => i.taskType === 'frontend' || i.taskType === 'design') ||
        /\b(ui|web ?app|website|dashboard|frontend|front-end|interface|screens?|landing page|portal)\b/i.test(text);
      if (!explicit && !hasUi) return null;
      const available = (await listBrands()).map((b) => b.slug);
      const slug = [explicit, planBrand].find((s) => s && available.includes(s)) ?? fittingBrand(text, available);
      const brand = await getBrand(slug);
      if (!brand) return null;
      await this.workspace.seedFile(projectId, 'BRAND.md', brand.content, `chore: brand system ${brand.name}`);
      if (goal.brand !== brand.slug) await this.goals.setBrand(goal.id, brand.slug);
      this.logger.log(`Goal ${goal.id} follows the ${brand.name} brand`);
      return brand;
    } catch (err) {
      // A missing brand never blocks planning; the work still happens.
      this.logger.warn(`Could not apply a brand to goal ${goal.id}: ${(err as Error).message}`);
      return null;
    }
  }

  private async readPlan(
    rootPath: string,
    goal: Goal,
  ): Promise<{ project: string; workItems: PlannedItem[]; hires: PlannedHire[]; brand?: string }> {
    try {
      const raw = await readFile(path.join(rootPath, 'PLAN.json'), 'utf8');
      const parsed = JSON.parse(raw) as { project?: unknown; workItems?: unknown; hires?: unknown; brand?: unknown } | null;
      // PLAN.json is model-written: trust nothing about its shape.
      const items = Array.isArray(parsed?.workItems) ? parsed!.workItems.flatMap(sanitizeItem) : [];
      if (items.length > 0) {
        const project =
          typeof parsed!.project === 'string' && parsed!.project.trim()
            ? parsed!.project.trim().slice(0, 200)
            : 'Delivery';
        const hires = Array.isArray(parsed!.hires) ? parsed!.hires.flatMap(sanitizeHire) : [];
        const brand = typeof parsed!.brand === 'string' ? parsed!.brand.trim().toLowerCase().slice(0, 50) : undefined;
        return { project, workItems: items, hires, brand };
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
          settings: { maxTurns: 100 },
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

  private planningPrompt(goal: Goal, roster: Array<{ name: string; role: string; department: string | null }>, brandLines: string[] = []): string {
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
      'Your team works IN PARALLEL like a real company: every item whose dependencies are done starts at once',
      'with whoever is free. So plan for parallel work: give every item "dependsOn" (use [] when it can start',
      'right away) and only depend on what an item truly needs. Agree interfaces up front in the descriptions',
      '(e.g. the API or data shape) so dependent work can start from the contract, not wait for the build.',
      'All items work in ONE shared repository; each starts from the integrated project at that moment and',
      'its result is merged back. Deliver what the goal actually asks for, in the format',
      'a professional would hand over: production applications, documentation, Excel workbooks',
      '(.xlsx, generated by a script that is kept in the repo), Word/PDF reports, slide decks, CSV data,',
      'diagrams, infrastructure code. Every deliverable is a file in the repository, with a check',
      'that proves it is right (tests for code, a script that opens and validates a workbook, etc.).',
      'Size every item to about 20-40 minutes of focused work for one senior specialist: a small goal is one',
      'or two items, a big one is split so the pieces run side by side (observed: one giant "frontend" item took',
      'hours alone while the rest of the team waited). Items that run in parallel must work in different',
      'files/folders (give each its own folder or module and name it in the description) so their results merge',
      'cleanly; start each such description with "Owns: <folders/files>" listing exactly what it may change. Put',
      'shared foundations in ONE SMALL contract item (at most 15 minutes of work: repo skeleton, shared types,',
      'database schema and the API contract as code, a smoke test; no features, no seed data, no UI) that the',
      'others depend on. Observed: one big "foundation" item made every other step wait for an hour. Seed data,',
      'the UI shell and every feature are separate items that start right after the contract, in parallel.',
      'Keep the critical path short: no chain of dependsOn longer than 3 items before the final review.',
      'Every item must leave the',
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
      'If the goal has a user interface (web app, site, dashboard, screens):',
      '- The first item is a "design" item for the designer: DESIGN.md that applies BRAND.md to this product: the',
      '  user journeys, which brand components and tokens each screen uses, the layout of every screen at desktop',
      '  and phone width, and every component with its states (empty, loading, error, filled). It never invents',
      '  its own palette, fonts or radii: the brand is the design system.',
      '- Frontend work builds exactly to DESIGN.md and depends on it: one "frontend" item for the app shell',
      '  (routing, layout, theme, shared components, API client), then one item per screen or feature area that',
      '  depends only on the shell, so the screens are built in parallel.',
      '- Unless the goal says otherwise: React + Vite + TypeScript, styled only with the tokens.css and',
      '  components.css from BRAND.md (Tailwind only through its tailwind-theme.css; Radix allowed for behaviour),',
      '  charts with a proper library in the brand chart colours, and "npm start" serving the production build.',
      '  Light only: no dark mode, no theme toggle. A backend, if needed, is its own item with a clean API.',
      '- Every UI item is checked by a design review of real screenshots before it is accepted.',
      'If the work needs expertise nobody in the organisation has, you may hire up to',
      `${process.env.FORGE_MAX_HIRES_PER_GOAL ?? DEFAULT_MAX_HIRES} senior specialists in "hires" (name, role, department, a description of their`,
      'expertise, and skills with levels 85-98). Only hire when it is truly needed; the new people',
      'will report to you and can be given this goal\'s items.',
      'Usefulness first: before listing screens, think like the real users of this product. Name the jobs they do',
      'every day and plan each one as a complete working workflow (create, edit, search, filter, act on it, export,',
      'see the result), with realistic seeded data. A screen that only displays numbers is not a feature. Prefer depth',
      'in the core workflows over many thin tabs, and make the acceptance checks exercise those workflows.',
      ...brandLines,
      'Write a file named PLAN.json in the current working directory with the shape:',
      `{ "project": string, "workItems": [ { "title": string, "description": string, "taskType": ${TASK_TYPES.filter((t) => t !== 'generic').map((t) => `"${t}"`).join('|')}, "acceptance": string[], "dependsOn"?: number[] } ], "brand"?: string, "hires"?: [ { "name": string, "role": string, "department": string, "description": string, "skills": [ { "skillKey": string, "level": number } ] } ] }`,
      'dependsOn: 0-based indices of earlier items this one needs; [] means it starts immediately in parallel.',
    ].join('\n');
  }

  private planningClaudeMd(planner: EmployeeWithRelations, goal: Goal): string {
    const brief = briefForEmployee(planner);
    return [
      SHARED_RULES,
      '',
      '---',
      '',
      brief
        ? renderBrief(brief)
        : [`# You are ${planner.name}, ${planner.role}`, '', planner.description ?? 'You lead an AI company (Forge). Plan strategically and delegate.'].join('\n'),
      '',
      '---',
      '',
      'You plan and delegate; specialists in each department do the work. Your plan is PLAN.json (see the task).',
      `Current goal: ${goal.title}`,
      '',
    ].join('\n');
  }
}
