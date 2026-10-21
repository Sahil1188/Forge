import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { RuntimeRegistry } from '../src/modules/runtimes/runtime-registry';
import { ExecutionWorker } from '../src/workers/execution.worker';
import { EvaluationWorker } from '../src/modules/evaluation/evaluation.worker';
import { HeartbeatWorker } from '../src/modules/heartbeats/heartbeat.worker';
import { CeoPlanner } from '../src/modules/heartbeats/ceo-planner.service';
import { agentRuns } from '../src/modules/runtimes/agent-runs.schema';
import { RuntimeEvent, RuntimeRunContext } from '../src/modules/runtimes/runtime.port';
import { ScriptedRuntime, bootApp, cancelStrayWork, createCompany, createEmployee, db, getWorkItem } from './helpers';

const REQUIRE_INDEX = `node -e "require('./index.js')"`;

describe('Short tasks, plan size, and acceptance checks (e2e)', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;

  beforeAll(async () => {
    app = await bootApp();
    server = app.getHttpServer();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(async () => {
    await cancelStrayWork(app); // planned-but-unrun items from one test must not be run by the next
  });
  afterEach(() => {
    delete process.env.FORGE_MAX_PLAN_ITEMS;
  });

  /** CEO (scripted plan) + a developer whose behaviour the test controls. */
  async function team(opts: {
    plan?: unknown;
    dev: (ctx: RuntimeRunContext, n: number) => AsyncIterable<RuntimeEvent>;
  }) {
    const ceoKey = `st-ceo-${randomUUID().slice(0, 6)}`;
    const devKey = `st-dev-${randomUUID().slice(0, 6)}`;
    const ceoRuntime = new ScriptedRuntime(ceoKey, async function* (ctx) {
      yield { kind: 'session', sessionId: 'ceo' } as RuntimeEvent;
      await writeFile(path.join(ctx.cwd, 'PLAN.json'), JSON.stringify(opts.plan ?? { workItems: [{ title: 'x' }] }));
      yield { kind: 'completed', result: 'ok', sessionId: 'ceo' } as RuntimeEvent;
    });
    const devRuntime = new ScriptedRuntime(devKey, opts.dev);
    app.get(RuntimeRegistry).register(ceoRuntime);
    app.get(RuntimeRegistry).register(devRuntime);
    const companyId = await createCompany(app);
    const ceo = await createEmployee(app, companyId, { name: 'Ceo', role: 'CEO', runtimeKey: ceoKey });
    const dev = await createEmployee(app, companyId, { name: 'Dev', role: 'Engineer', runtimeKey: devKey });
    return { companyId, ceo, dev, ceoRuntime, devRuntime };
  }

  const goal = async (companyId: string, body: object) =>
    (await request(server).post(`/companies/${companyId}/goals`).send(body).expect(201)).body;

  describe('direct mode (short tasks)', () => {
    it('skips the CEO entirely: one work item, straight to the best employee, no planning run', async () => {
      const t = await team({ dev: async function* () {} });
      const g = await goal(t.companyId, { title: 'Fix the typo in README', description: 'teh → the', mode: 'direct' });
      expect(g.mode).toBe('direct');

      const plan = await app.get(CeoPlanner).plan(g.id);
      expect(plan.ceoRunId).toBeNull();
      expect(plan.workItems).toHaveLength(1);
      expect(plan.workItems[0]).toMatchObject({ title: 'Fix the typo in README', assignedTo: t.dev });
      expect(t.ceoRuntime.runs).toBe(0);
      expect(await db(app).select().from(agentRuns).where(eq(agentRuns.goalId, g.id))).toEqual([]);

      const item = (await request(server).get(`/work-items/${plan.workItems[0].workItemId}`).expect(200)).body;
      expect(item.description).toBe('teh → the');
      await request(server).post(`/work-items/${item.id}/status`).send({ status: 'cancelled' }).expect(201);
    });

    it('works through the normal goal-start trigger and the HTTP plan endpoint', async () => {
      const t = await team({ dev: async function* () {} });
      const g = await goal(t.companyId, { title: 'Bump version', mode: 'direct' });
      const plan = await app.get(HeartbeatWorker).onGoalStarted(g.id);
      expect(plan?.ceoRunId).toBeNull();
      expect(plan?.workItems).toHaveLength(1);
      await request(server).post(`/work-items/${plan!.workItems[0].workItemId}/status`).send({ status: 'cancelled' }).expect(201);
    });

    it('carries the goal’s acceptance checks onto the single item', async () => {
      const t = await team({ dev: async function* () {} });
      const g = await goal(t.companyId, { title: 'Add index', mode: 'direct', acceptance: [REQUIRE_INDEX] });
      const plan = await app.get(CeoPlanner).plan(g.id);
      const item = (await request(server).get(`/work-items/${plan.workItems[0].workItemId}`).expect(200)).body;
      expect(item.acceptance).toEqual([REQUIRE_INDEX]);
      await request(server).post(`/work-items/${item.id}/status`).send({ status: 'cancelled' }).expect(201);
    });

    it('validates mode and acceptance on goal creation', async () => {
      const companyId = await createCompany(app);
      await request(server).post(`/companies/${companyId}/goals`).send({ title: 'x', mode: 'yolo' }).expect(400);
      await request(server).post(`/companies/${companyId}/goals`).send({ title: 'x', acceptance: 'npm test' }).expect(400);
      await request(server).post(`/companies/${companyId}/goals`).send({ title: 'x', acceptance: [42] }).expect(400);
      expect((await goal(companyId, { title: 'defaults' })).mode).toBe('plan');
    });
  });

  describe('plan size cap', () => {
    it('folds an over-sliced plan into at most FORGE_MAX_PLAN_ITEMS (default 3) without dropping work', async () => {
      const t = await team({
        plan: {
          workItems: [
            { title: 'Init project' },
            { title: 'Write module', description: 'core logic' },
            { title: 'Write tests', description: 'cover it' },
            { title: 'Add docs' },
            { title: 'Verify end to end' },
          ],
        },
        dev: async function* () {},
      });
      const plan = await app.get(CeoPlanner).plan((await goal(t.companyId, { title: 'Lib' })).id);
      expect(plan.workItems.map((w) => w.title)).toEqual(['Init project', 'Write module', 'Write tests']);
      const last = (await request(server).get(`/work-items/${plan.workItems[2].workItemId}`).expect(200)).body;
      expect(last.description).toContain('Add docs');
      expect(last.description).toContain('Verify end to end');
    });

    it('the cap is configurable', async () => {
      process.env.FORGE_MAX_PLAN_ITEMS = '1';
      const t = await team({ plan: { workItems: [{ title: 'a' }, { title: 'b' }] }, dev: async function* () {} });
      const plan = await app.get(CeoPlanner).plan((await goal(t.companyId, { title: 'Small' })).id);
      expect(plan.workItems).toHaveLength(1);
    });
  });

  describe('acceptance checks from the CEO and the goal', () => {
    it('stores per-item checks from PLAN.json and puts the goal’s checks on the final item', async () => {
      const t = await team({
        plan: {
          workItems: [
            { title: 'a', acceptance: [`node -e "require('./a.js')"`] },
            { title: 'b', acceptance: ['', 7, `node -e "require('./b.js')"`] },
          ],
        },
        dev: async function* () {},
      });
      const plan = await app.get(CeoPlanner).plan((await goal(t.companyId, { title: 'G', acceptance: [REQUIRE_INDEX] })).id);
      const [a, b] = await Promise.all(
        plan.workItems.map(async (w) => (await request(server).get(`/work-items/${w.workItemId}`).expect(200)).body),
      );
      expect(a.acceptance).toEqual([`node -e "require('./a.js')"`]);
      expect(b.acceptance).toEqual([`node -e "require('./b.js')"`, REQUIRE_INDEX]);
    });

    it('the developer is told the checks up front', async () => {
      const t = await team({ dev: async function* () {} });
      const g = await goal(t.companyId, { title: 'Index', mode: 'direct', acceptance: [REQUIRE_INDEX] });
      await app.get(CeoPlanner).plan(g.id);
      await app.get(ExecutionWorker).runOnce();
      expect(t.devRuntime.contexts[0].task).toContain(REQUIRE_INDEX);
      expect(t.devRuntime.contexts[0].task).toMatch(/accepted only if/);
    });

    it('right code, wrong layout: passing tests but a failing check → rework, then the fix passes and merges', async () => {
      const pkg = JSON.stringify({ name: 'p', version: '1.0.0', scripts: { test: 'node -e "process.exit(0)"' } });
      const t = await team({
        dev: async function* (ctx, n) {
          yield { kind: 'session', sessionId: `s${n}` } as RuntimeEvent;
          await writeFile(path.join(ctx.cwd, 'package.json'), pkg);
          // Attempt 1 puts the entry point in the wrong place; attempt 2 follows the brief.
          await writeFile(path.join(ctx.cwd, n === 1 ? 'main.js' : 'index.js'), 'module.exports = {};');
          yield { kind: 'completed', result: 'ok', sessionId: `s${n}` } as RuntimeEvent;
        },
      });
      const g = await goal(t.companyId, { title: 'Entry point', mode: 'direct', acceptance: [REQUIRE_INDEX] });
      const plan = await app.get(CeoPlanner).plan(g.id);
      const id = plan.workItems[0].workItemId;

      await app.get(ExecutionWorker).runOnce();
      const first = await app.get(EvaluationWorker).evaluate(id);
      expect(first).toMatchObject({ status: 'failed', routedTo: 'rework', overallScore: 50 }); // tests green, check red

      expect(await app.get(EvaluationWorker).retryOrFail(id)).toBe('retried');
      await app.get(ExecutionWorker).runOnce();
      const second = await app.get(EvaluationWorker).evaluate(id);
      expect(second).toMatchObject({ status: 'passed', routedTo: 'done', overallScore: 100 });
      expect((await getWorkItem(app, id)).status).toBe('done');
      expect((await request(server).get(`/goals/${g.id}`).expect(200)).body.status).toBe('completed');
    });

    it('acceptance checks alone verify an item that has no package.json (no more "done but unverified")', async () => {
      const t = await team({
        dev: async function* (ctx) {
          yield { kind: 'session', sessionId: 's' } as RuntimeEvent;
          await writeFile(path.join(ctx.cwd, 'index.js'), 'module.exports = 1;');
          yield { kind: 'completed', result: 'ok', sessionId: 's' } as RuntimeEvent;
        },
      });
      const g = await goal(t.companyId, { title: 'Bare', mode: 'direct', acceptance: [REQUIRE_INDEX] });
      const plan = await app.get(CeoPlanner).plan(g.id);
      await app.get(ExecutionWorker).runOnce();
      const ev = await app.get(EvaluationWorker).evaluate(plan.workItems[0].workItemId);
      expect(ev).toMatchObject({ status: 'passed', overallScore: 100 });
    });

    it('work items accept acceptance checks over the API too', async () => {
      const companyId = await createCompany(app);
      const g = await goal(companyId, { title: 'G' });
      const project = (await request(server).post(`/goals/${g.id}/projects`).send({ name: 'P' }).expect(201)).body.id;
      const res = await request(server)
        .post(`/projects/${project}/work-items`)
        .send({ title: 'w', acceptance: [REQUIRE_INDEX] })
        .expect(201);
      expect(res.body.acceptance).toEqual([REQUIRE_INDEX]);
      await request(server).post(`/projects/${project}/work-items`).send({ title: 'w', acceptance: [1] }).expect(400);
    });
  });
});
