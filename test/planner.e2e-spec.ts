import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { RuntimeRegistry } from '../src/modules/runtimes/runtime-registry';
import { AgentRunsService } from '../src/modules/runtimes/agent-runs.service';
import { BudgetsService } from '../src/modules/budgets/budgets.service';
import { CeoPlanner } from '../src/modules/heartbeats/ceo-planner.service';
import { HeartbeatWorker } from '../src/modules/heartbeats/heartbeat.worker';
import { heartbeats } from '../src/modules/heartbeats/heartbeats.schema';
import { agentRuns } from '../src/modules/runtimes/agent-runs.schema';
import { RuntimeEvent, RuntimeRunContext } from '../src/modules/runtimes/runtime.port';
import {
  ScriptedRuntime,
  bootApp,
  cancelStrayWork,
  createCompany,
  createEmployee,
  db,
} from './helpers';

describe('CEO planning, org hierarchy and routing (e2e)', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;
  let seq = 0;

  beforeAll(async () => {
    app = await bootApp();
    server = app.getHttpServer();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(async () => {
    await cancelStrayWork(app);
  });

  /** Registers a CEO runtime whose PLAN.json content (or behaviour) the test controls. */
  function ceoRuntime(plan: unknown | undefined, opts: { raw?: string; tail?: RuntimeEvent[] } = {}) {
    const key = `ceo-${(seq += 1)}-${randomUUID().slice(0, 6)}`;
    const rt = new ScriptedRuntime(key, async function* (ctx: RuntimeRunContext) {
      yield { kind: 'session', sessionId: 'ceo-s' } as RuntimeEvent;
      if (opts.raw !== undefined) await writeFile(path.join(ctx.cwd, 'PLAN.json'), opts.raw);
      else if (plan !== undefined) await writeFile(path.join(ctx.cwd, 'PLAN.json'), JSON.stringify(plan));
      yield { kind: 'usage', inputTokens: 100, outputTokens: 50, costUsd: 0.25 } as RuntimeEvent;
      for (const e of opts.tail ?? [{ kind: 'completed', result: 'planned', sessionId: 'ceo-s' } as RuntimeEvent]) yield e;
    });
    app.get(RuntimeRegistry).register(rt);
    return rt;
  }

  /** A company with a CEO (on `runtimeKey`) and a Node dev + a designer. */
  async function company(runtimeKey: string) {
    const companyId = await createCompany(app, `Plan Co ${runtimeKey}`);
    const ceo = await createEmployee(app, companyId, { name: 'Ada', role: 'CEO', runtimeKey, modelPolicy: { default: 'ceo-model' } });
    const dev = await createEmployee(app, companyId, {
      name: 'Grace',
      role: 'Backend Engineer',
      managerEmployeeId: ceo,
      runtimeKey,
      skills: [{ skillKey: 'node', level: 90 }],
    });
    const designer = await createEmployee(app, companyId, {
      name: 'Dee',
      role: 'Designer',
      managerEmployeeId: ceo,
      runtimeKey,
      skills: [{ skillKey: 'figma', level: 95 }],
    });
    return { companyId, ceo, dev, designer };
  }

  const newGoal = async (companyId: string, title = 'Ship the thing') =>
    (await request(server).post(`/companies/${companyId}/goals`).send({ title }).expect(201)).body.id as string;

  const itemsOf = async (projectId: string) =>
    (await request(server).get(`/projects/${projectId}/work-items`).expect(200)).body as Array<{
      id: string;
      title: string;
      taskType: string;
      status: string;
      assignedEmployeeId: string | null;
      description: string | null;
    }>;

  describe('finding the CEO (hierarchy)', () => {
    const planner = () => app.get(CeoPlanner);

    it('prefers an employee whose role says CEO, even if they have a manager', async () => {
      const companyId = await createCompany(app);
      const founder = await createEmployee(app, companyId, { name: 'Founder', role: 'Founder' });
      await createEmployee(app, companyId, { name: 'Boss', role: 'CEO', managerEmployeeId: founder });
      expect((await planner().findCeo(companyId))?.name).toBe('Boss');
    });

    it('recognises "Chief …" titles', async () => {
      const companyId = await createCompany(app);
      await createEmployee(app, companyId, { name: 'Dev', role: 'Engineer' });
      await createEmployee(app, companyId, { name: 'Cto', role: 'Chief Technology Officer' });
      expect((await planner().findCeo(companyId))?.name).toBe('Cto');
    });

    it('falls back to the top of the org (no manager) when nobody is titled CEO', async () => {
      const companyId = await createCompany(app);
      const top = await createEmployee(app, companyId, { name: 'Top', role: 'Founder' });
      await createEmployee(app, companyId, { name: 'Report', role: 'Engineer', managerEmployeeId: top });
      expect((await planner().findCeo(companyId))?.name).toBe('Top');
    });

    it('the executive who owns the goal’s domain plans it; everything else goes to the CEO', async () => {
      const companyId = await createCompany(app);
      const ceo = await createEmployee(app, companyId, { name: 'Ceo', role: 'CEO', department: 'Leadership' });
      await createEmployee(app, companyId, { name: 'Cfo', role: 'Chief Financial Officer', department: 'Finance', managerEmployeeId: ceo });
      await createEmployee(app, companyId, { name: 'Analyst', role: 'Senior Financial Analyst', department: 'Finance' });
      const goal = (title: string) => ({ id: randomUUID(), companyId, title, description: null }) as never;
      expect((await planner().findPlanner(goal('Build a revenue forecast and cash flow model')))?.name).toBe('Cfo');
      expect((await planner().findPlanner(goal('Add a REST API endpoint')))?.name).toBe('Ceo');
      expect((await planner().findPlanner(goal('Threat model the login flow')))?.name).toBe('Ceo'); // no CISO here
    });

    it('returns null for a company with no employees', async () => {
      expect(await planner().findCeo(await createCompany(app))).toBeNull();
    });

    it('is scoped to the company: another tenant’s CEO is never picked', async () => {
      const a = await createCompany(app, 'A');
      const b = await createCompany(app, 'B');
      await createEmployee(app, b, { name: 'B-CEO', role: 'CEO' });
      expect(await planner().findCeo(a)).toBeNull();
    });

    it('a goal with nobody to plan it yields no plan and no heartbeat (HTTP and worker agree)', async () => {
      const companyId = await createCompany(app);
      const goalId = await newGoal(companyId);
      expect(await app.get(HeartbeatWorker).onGoalStarted(goalId)).toBeNull();
      const beats = await db(app).select().from(heartbeats).where(eq(heartbeats.goalId, goalId));
      expect(beats).toEqual([]);
      await request(server).post(`/goals/${randomUUID()}/plan`).expect(404);
    });
  });

  describe('turning a goal into routed work', () => {
    it('creates the project and work items from PLAN.json and routes each to the best-fit employee', async () => {
      const rt = ceoRuntime({
        project: 'Launch',
        workItems: [
          { title: 'Build the API', description: 'express + tests', taskType: 'coding' },
          { title: 'Design the logo', taskType: 'generic' },
        ],
      });
      const { companyId, dev } = await company(rt.key);
      const goalId = await newGoal(companyId);
      const plan = (await request(server).post(`/goals/${goalId}/plan`).expect(201)).body;

      expect(plan.workItems).toHaveLength(2);
      const items = await itemsOf(plan.projectId);
      const api = items.find((i) => i.title === 'Build the API')!;
      expect(api).toMatchObject({ taskType: 'coding', status: 'assigned', assignedEmployeeId: dev, description: 'express + tests' });
      const project = (await request(server).get(`/projects/${plan.projectId}`).expect(200)).body;
      expect(project.name).toBe('Launch');
      expect(project.goalId).toBe(goalId);
    });

    it('the planner can hire specialists it needs: bounded, no executives, no duplicate roles, reporting to the planner', async () => {
      const rt = ceoRuntime({
        project: 'Network rollout',
        workItems: [{ title: 'Design the office network', taskType: 'network' }],
        hires: [
          { name: 'Ravi', role: 'Senior Network Engineer', department: 'Cloud & Infrastructure', description: 'BGP, VPN, firewalls', skills: [{ skillKey: 'networking', level: 96 }, { skillKey: 'vpn', level: 999 }] },
          { name: 'Boss2', role: 'Chief Network Officer', skills: [] },
          { name: 'Dup', role: 'Senior Network Engineer', skills: [] },
          { name: 'Iris', role: 'Senior Security Engineer', skills: [{ skillKey: 'firewalls', level: 90 }] },
          { name: 'Extra', role: 'Senior Cabling Specialist', skills: [] },
        ],
      });
      const { companyId, ceo } = await company(rt.key);
      const goalId = await newGoal(companyId);
      await app.get(CeoPlanner).plan(goalId);

      const team = (await request(server).get(`/companies/${companyId}/employees`).expect(200)).body as Array<{ id: string; name: string; role: string; managerEmployeeId: string | null }>;
      const hired = team.filter((e) => ['Ravi', 'Boss2', 'Dup', 'Iris', 'Extra'].includes(e.name));
      expect(hired.map((e) => e.name).sort()).toEqual(['Iris', 'Ravi']); // cap 2, executive and duplicate skipped
      for (const e of hired) expect(e.managerEmployeeId).toBe(ceo);
      const ravi = (await request(server).get(`/employees/${hired.find((e) => e.name === 'Ravi')!.id}`).expect(200)).body;
      expect(ravi.skills).toEqual(expect.arrayContaining([expect.objectContaining({ skillKey: 'vpn', level: 98 })]));
    });

    it('every goal ends with an independent production review: last, after all build steps, all checks kept, never the builder', async () => {
      process.env.FORGE_PRODUCTION_REVIEW = '1';
      try {
        const rt = ceoRuntime({
          project: 'API',
          workItems: [{ title: 'Build the API', taskType: 'coding', acceptance: ['node -e "process.exit(0)"'] }],
        });
        const { companyId } = await company(rt.key);
        const goalId = await newGoal(companyId);
        const plan = await app.get(CeoPlanner).plan(goalId);
        expect(plan.workItems).toHaveLength(2);
        const [build, review] = plan.workItems;
        expect(review.title).toBe('Production review and hardening');
        expect(review.assignedTo).toBeTruthy();
        expect(review.assignedTo).not.toBe(build.assignedTo);
        const items = await itemsOf(plan.projectId);
        const r = items.find((i) => i.id === review.workItemId)! as unknown as { taskType: string; acceptance: string[]; description: string };
        expect(r.taskType).toBe('review');
        expect(r.acceptance).toEqual(['node -e "process.exit(0)"']);
        expect(r.description).toMatch(/fix each gap yourself/);
        const deps = (await request(server).get(`/work-items/${review.workItemId}`).expect(200)).body;
        expect(JSON.stringify(deps)).toContain(build.workItemId);
      } finally {
        process.env.FORGE_PRODUCTION_REVIEW = '0';
      }
    });

    it('the planning run is recorded at goal level on the CEO’s model, with usage', async () => {
      const rt = ceoRuntime({ workItems: [{ title: 'x', taskType: 'coding' }] });
      const { companyId, ceo } = await company(rt.key);
      const goalId = await newGoal(companyId);
      const plan = await app.get(CeoPlanner).plan(goalId);
      const run = await app.get(AgentRunsService).findOne(plan.ceoRunId);
      expect(run).toMatchObject({ goalId, workItemId: null, employeeId: ceo, status: 'completed', model: 'ceo-model' });
      expect(run.estimatedCostUsd).toBeCloseTo(0.25, 10);
      expect(run.inputTokens).toBe(100);
    });

    it('hands the CEO a planning prompt with the goal and an explicit workspace', async () => {
      const rt = ceoRuntime({ workItems: [{ title: 'x' }] });
      const { companyId } = await company(rt.key);
      const goalId = await newGoal(companyId, 'Conquer the market');
      await app.get(CeoPlanner).plan(goalId);
      const ctx = rt.contexts[0];
      expect(ctx.task).toContain('Conquer the market');
      expect(ctx.task).toContain('PLAN.json');
      expect(ctx.workItemId).toBe(`plan:${goalId}`);
    });

    it('is idempotent per goal: a replayed or duplicate goal.started never plans the same goal twice (live bug: old events re-planned a finished goal)', async () => {
      const rt = ceoRuntime({ workItems: [{ title: 'once', taskType: 'coding' }] });
      const { companyId } = await company(rt.key);
      const goalId = await newGoal(companyId);
      const hb = app.get(HeartbeatWorker);

      const first = await hb.onGoalStarted(goalId);
      const second = await hb.onGoalStarted(goalId);
      expect(first).not.toBeNull();
      expect(second).toBeNull();
      expect(rt.runs).toBe(1);
      expect((await request(server).get(`/goals/${goalId}/projects`).expect(200)).body).toHaveLength(1);
    });

    it('a failed planning attempt may be retried (only a planned goal is skipped)', async () => {
      const key = `ceo-retry-${randomUUID().slice(0, 6)}`;
      const rt = new ScriptedRuntime(key, async function* (ctx, n) {
        yield { kind: 'session', sessionId: 's' } as RuntimeEvent;
        if (n === 1) throw new Error('transient');
        await writeFile(path.join(ctx.cwd, 'PLAN.json'), JSON.stringify({ workItems: [{ title: 'ok' }] }));
        yield { kind: 'completed', result: 'ok', sessionId: 's' } as RuntimeEvent;
      });
      app.get(RuntimeRegistry).register(rt);
      const { companyId } = await company(key);
      const goalId = await newGoal(companyId);
      await expect(app.get(HeartbeatWorker).onGoalStarted(goalId)).rejects.toThrow('transient');
      expect(await app.get(HeartbeatWorker).onGoalStarted(goalId)).not.toBeNull();
    });

    it('the explicit HTTP re-plan always wakes the CEO (a human asking is not a replay)', async () => {
      const rt = ceoRuntime({ workItems: [{ title: 'again' }] });
      const { companyId } = await company(rt.key);
      const goalId = await newGoal(companyId);
      await request(server).post(`/goals/${goalId}/plan`).expect(201);
      const second = await request(server).post(`/goals/${goalId}/plan`).expect(201);
      expect(second.body.workItems).toHaveLength(1);
      expect(rt.runs).toBe(2);
    });

    it('records the heartbeat as done on success', async () => {
      const rt = ceoRuntime({ workItems: [{ title: 'x' }] });
      const { companyId } = await company(rt.key);
      const goalId = await newGoal(companyId);
      await app.get(HeartbeatWorker).onGoalStarted(goalId);
      const [beat] = await db(app).select().from(heartbeats).where(eq(heartbeats.goalId, goalId));
      expect(beat.status).toBe('done');
    });

    it('a company whose only employee is the CEO assigns the work to the CEO', async () => {
      const rt = ceoRuntime({ workItems: [{ title: 'solo', taskType: 'coding' }] });
      const companyId = await createCompany(app);
      const ceo = await createEmployee(app, companyId, { name: 'Solo', role: 'CEO', runtimeKey: rt.key });
      const plan = await app.get(CeoPlanner).plan(await newGoal(companyId));
      expect(plan.workItems[0].assignedTo).toBe(ceo);
    });

    it('never assigns work across tenants', async () => {
      const rt = ceoRuntime({ workItems: [{ title: 'mine', taskType: 'coding' }] });
      const mine = await company(rt.key);
      const other = await company('unused');
      const plan = await app.get(CeoPlanner).plan(await newGoal(mine.companyId));
      expect([mine.dev, mine.designer, mine.ceo]).toContain(plan.workItems[0].assignedTo);
      expect([other.dev, other.designer, other.ceo]).not.toContain(plan.workItems[0].assignedTo);
    });
  });

  describe('who gets the work', () => {
    it('execution work goes to a non-executive even when the task smells executive (architecture)', async () => {
      const rt = ceoRuntime({ workItems: [{ title: 'Design the system', taskType: 'architecture' }] });
      const { companyId, ceo } = await company(rt.key);
      const plan = await app.get(CeoPlanner).plan(await newGoal(companyId));
      expect(plan.workItems[0].assignedTo).not.toBe(ceo);
    });

    it('skips an employee whose runtime cannot run, even if they are the best fit on paper', async () => {
      const rt = ceoRuntime({ workItems: [{ title: 'Build API', taskType: 'coding' }] });
      const companyId = await createCompany(app);
      await createEmployee(app, companyId, { name: 'Ceo', role: 'CEO', runtimeKey: rt.key });
      const star = await createEmployee(app, companyId, {
        name: 'Star', role: 'Backend Engineer', runtimeKey: 'not-installed', skills: [{ skillKey: 'node', level: 99 }],
      });
      const ok = await createEmployee(app, companyId, {
        name: 'Ok', role: 'Engineer', runtimeKey: rt.key, skills: [{ skillKey: 'node', level: 40 }],
      });
      const plan = await app.get(CeoPlanner).plan(await newGoal(companyId));
      expect(plan.workItems[0].assignedTo).toBe(ok);
      expect(plan.workItems[0].assignedTo).not.toBe(star);
    });

    it('skips a local-LLM worker when Ollama is not reachable', async () => {
      process.env.FORGE_OLLAMA_HOST = 'http://127.0.0.1:9';
      try {
        const rt = ceoRuntime({ workItems: [{ title: 'Build UI', taskType: 'coding' }] });
        const companyId = await createCompany(app);
        await createEmployee(app, companyId, { name: 'Ceo', role: 'CEO', runtimeKey: rt.key });
        const local = await createEmployee(app, companyId, {
          name: 'Kai', role: 'Frontend Engineer', runtimeKey: 'custom', provider: 'ollama', skills: [{ skillKey: 'typescript', level: 95 }],
        });
        const ok = await createEmployee(app, companyId, { name: 'Ok', role: 'Engineer', runtimeKey: rt.key });
        const plan = await app.get(CeoPlanner).plan(await newGoal(companyId));
        expect(plan.workItems[0].assignedTo).toBe(ok);
        expect(plan.workItems[0].assignedTo).not.toBe(local);
      } finally {
        delete process.env.FORGE_OLLAMA_HOST;
      }
    });

    it('falls back to the CEO when no one else can run', async () => {
      const rt = ceoRuntime({ workItems: [{ title: 'x', taskType: 'coding' }] });
      const companyId = await createCompany(app);
      const ceo = await createEmployee(app, companyId, { name: 'Ceo', role: 'CEO', runtimeKey: rt.key });
      await createEmployee(app, companyId, { name: 'Ghost', role: 'Engineer', runtimeKey: 'not-installed' });
      const plan = await app.get(CeoPlanner).plan(await newGoal(companyId));
      expect(plan.workItems[0].assignedTo).toBe(ceo);
    });

    it('leaves work unassigned (not doomed) when nobody in the company can run it', async () => {
      const companyId = await createCompany(app);
      await createEmployee(app, companyId, { name: 'Ghost', role: 'Engineer', runtimeKey: 'not-installed' });
      const goal = (await request(server).post(`/companies/${companyId}/goals`).send({ title: 'g' }).expect(201)).body.id;
      const project = (await request(server).post(`/goals/${goal}/projects`).send({ name: 'p' }).expect(201)).body.id;
      const item = (await request(server).post(`/projects/${project}/work-items`).send({ title: 'w' }).expect(201)).body.id;
      await request(server).post(`/work-items/${item}/route`).expect(400);
      expect((await request(server).get(`/work-items/${item}`).expect(200)).body.status).toBe('created');
    });
  });

  describe('robustness to a bad PLAN.json', () => {
    const planOf = async (plan: unknown, opts: { raw?: string } = {}) => {
      const rt = ceoRuntime(plan, opts);
      const { companyId } = await company(rt.key);
      const goalId = await newGoal(companyId, 'Fallback goal');
      const result = await app.get(CeoPlanner).plan(goalId);
      const project = (await request(server).get(`/projects/${result.projectId}`).expect(200)).body;
      return { result, items: await itemsOf(result.projectId), project };
    };

    it('no PLAN.json at all → a single sensible fallback item', async () => {
      const { items, project } = await planOf(undefined);
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({ title: 'Deliver: Fallback goal', taskType: 'coding' });
      expect(project.name).toBe('Delivery');
    });

    it('unparseable JSON → fallback', async () => {
      const { items } = await planOf(undefined, { raw: '{ this is not json' });
      expect(items.map((i) => i.title)).toEqual(['Deliver: Fallback goal']);
    });

    it('empty or non-array workItems → fallback', async () => {
      expect((await planOf({ project: 'P', workItems: [] })).items).toHaveLength(1);
      expect((await planOf({ project: 'P', workItems: 'nope' })).items).toHaveLength(1);
      expect((await planOf([1, 2, 3])).items).toHaveLength(1);
      expect((await planOf(null)).items).toHaveLength(1);
    });

    it('an unknown taskType is coerced to coding rather than rejected', async () => {
      const { items } = await planOf({ workItems: [{ title: 'a', taskType: 'sorcery' }, { title: 'b' }] });
      expect(items.map((i) => i.taskType)).toEqual(['coding', 'coding']);
    });

    it('skips malformed entries (no title, wrong types, nulls) instead of aborting the whole plan', async () => {
      const { items } = await planOf({
        workItems: [null, 42, 'str', {}, { title: '' }, { title: 7 }, { description: 'orphan' }, { title: 'Valid one' }],
      });
      expect(items.map((i) => i.title)).toEqual(['Valid one']);
    });

    it('when every entry is malformed it still falls back to the default item', async () => {
      const { items } = await planOf({ workItems: [null, {}, { title: '' }] });
      expect(items.map((i) => i.title)).toEqual(['Deliver: Fallback goal']);
    });

    it('over-long titles are truncated to the API limit instead of failing', async () => {
      const { items } = await planOf({ workItems: [{ title: 'T'.repeat(500) }] });
      expect(items[0].title.length).toBeLessThanOrEqual(300);
    });

    it('a non-string description is dropped, a missing project name defaults', async () => {
      const { items, project } = await planOf({ project: 123, workItems: [{ title: 'a', description: { evil: true } }] });
      expect(items[0].description).toBeNull();
      expect(project.name).toBe('Delivery');
    });
  });

  describe('planning failures and governance', () => {
    it('a CEO runtime that throws marks its run failed (never left "running") and the heartbeat failed, then surfaces the error', async () => {
      const key = `ceo-throw-${randomUUID().slice(0, 6)}`;
      app.get(RuntimeRegistry).register(
        new ScriptedRuntime(key, async function* () {
          yield { kind: 'session', sessionId: 's' } as RuntimeEvent;
          throw new Error('planner crashed');
        }),
      );
      const { companyId, ceo } = await company(key);
      const goalId = await newGoal(companyId);
      await expect(app.get(HeartbeatWorker).onGoalStarted(goalId)).rejects.toThrow('planner crashed');

      const [run] = await db(app).select().from(agentRuns).where(eq(agentRuns.goalId, goalId));
      expect(run.employeeId).toBe(ceo);
      expect(run.status).toBe('failed');
      expect(JSON.stringify(run.errorJson)).toContain('planner crashed');
      const [beat] = await db(app).select().from(heartbeats).where(eq(heartbeats.goalId, goalId));
      expect(beat.status).toBe('failed');
    });

    it('a CEO run that ends in failure does not fabricate work from the fallback', async () => {
      const rt = ceoRuntime(undefined, { tail: [{ kind: 'failed', error: 'error_max_turns' }] });
      const { companyId } = await company(rt.key);
      const goalId = await newGoal(companyId);
      await expect(app.get(CeoPlanner).plan(goalId)).rejects.toThrow(/planning run failed/i);
      const [run] = await db(app).select().from(agentRuns).where(eq(agentRuns.goalId, goalId));
      expect(run.status).toBe('failed');
      expect((await request(server).get(`/goals/${goalId}/projects`).expect(200)).body).toEqual([]);
    });

    it('records the CEO’s planning spend so it counts against the CEO’s budget', async () => {
      const rt = ceoRuntime({ workItems: [{ title: 'x' }] });
      const { companyId, ceo } = await company(rt.key);
      await app.get(CeoPlanner).plan(await newGoal(companyId));
      expect(await app.get(BudgetsService).spend(ceo, 'total')).toBeCloseTo(0.25, 10);
    });

    it('refuses to plan when the CEO’s budget is already exhausted (no run, no spend)', async () => {
      const rt = ceoRuntime({ workItems: [{ title: 'x' }] });
      const { companyId, ceo } = await company(rt.key);
      await request(server).put(`/employees/${ceo}/budget`).send({ hardLimitUsd: 1, softLimitUsd: 0.5 }).expect(200);
      await app.get(BudgetsService).recordCost(null, ceo, { costUsd: 1 });
      const goalId = await newGoal(companyId);
      await expect(app.get(CeoPlanner).plan(goalId)).rejects.toThrow(/budget/i);
      expect(rt.runs).toBe(0);
      expect(await db(app).select().from(agentRuns).where(eq(agentRuns.goalId, goalId))).toEqual([]);
    });

    it('keeps the planner inside its workspace (confinement gate present with no other policy)', async () => {
      const seen: string[] = [];
      const key = `ceo-gate-${randomUUID().slice(0, 6)}`;
      app.get(RuntimeRegistry).register(
        new ScriptedRuntime(key, async function* (ctx) {
          yield { kind: 'session', sessionId: 's' } as RuntimeEvent;
          seen.push((await ctx.canUseTool!('Write', { file_path: path.join(ctx.cwd, 'PLAN.json') })).behavior);
          seen.push((await ctx.canUseTool!('Write', { file_path: path.join(ctx.cwd, '..', 'escape.json') })).behavior);
          seen.push((await ctx.canUseTool!('Bash', { command: 'ls' })).behavior);
          yield { kind: 'completed', result: 'ok', sessionId: 's' } as RuntimeEvent;
        }),
      );
      const { companyId } = await company(key);
      await app.get(CeoPlanner).plan(await newGoal(companyId));
      expect(seen).toEqual(['allow', 'deny', 'allow']);
    });
  });
});
