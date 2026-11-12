import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { RuntimeRegistry } from '../src/modules/runtimes/runtime-registry';
import { ExecutionWorker } from '../src/workers/execution.worker';
import { EvaluationWorker } from '../src/modules/evaluation/evaluation.worker';
import { CeoPlanner } from '../src/modules/heartbeats/ceo-planner.service';
import { WORKSPACE_PORT, WorkspacePort } from '../src/modules/workspaces/workspace.port';
import { events as eventsTable } from '../src/infrastructure/events/events.schema';
import { workItems } from '../src/modules/work/work.schema';
import { evaluations } from '../src/modules/evaluation/evaluation.schema';
import { EventTypes } from '../src/infrastructure/events/event-types';
import { RuntimeEvent, RuntimeRunContext } from '../src/modules/runtimes/runtime.port';
import {
  ScriptedRuntime,
  assign,
  bootApp,
  createCompany,
  createEmployee,
  createProject,
  createWorkItem,
  db,
  getWorkItem,
} from './helpers';

const git = promisify(execFile);
const passingPkg = JSON.stringify({
  name: 'p',
  version: '1.0.0',
  scripts: { test: 'node -e "process.exit(0)"' },
});
const failingPkg = JSON.stringify({
  name: 'p',
  version: '1.0.0',
  scripts: { test: 'node -e "process.exit(1)"' },
});

describe('Shared project workspace — work items build on each other (e2e)', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;

  beforeAll(async () => {
    app = await bootApp();
    server = app.getHttpServer();
  });
  afterAll(async () => {
    await app.close();
  });
  afterEach(() => {
    delete process.env.FORGE_MAX_ATTEMPTS;
  });

  const worker = () => app.get(ExecutionWorker);
  const evaluator = () => app.get(EvaluationWorker);
  const workspace = () => app.get<WorkspacePort>(WORKSPACE_PORT);

  /** Company + one employee on a scripted runtime + a project. */
  async function setup(script: (ctx: RuntimeRunContext, n: number) => AsyncIterable<RuntimeEvent>) {
    const key = `proj-${randomUUID().slice(0, 8)}`;
    const runtime = new ScriptedRuntime(key, script);
    app.get(RuntimeRegistry).register(runtime);
    const companyId = await createCompany(app);
    const emp = await createEmployee(app, companyId, {
      name: 'Builder',
      role: 'Engineer',
      runtimeKey: key,
    });
    const { projectId, goalId } = await createProject(app, companyId);
    return { runtime, companyId, emp, projectId, goalId };
  }

  /** A script driven by a per-title map of file writes. */
  function writes(byTitle: Record<string, Record<string, string>>) {
    return async function* (ctx: RuntimeRunContext): AsyncIterable<RuntimeEvent> {
      yield { kind: 'session', sessionId: 's' };
      const files = byTitle[ctx.task.split('\n')[0]] ?? {};
      for (const [name, content] of Object.entries(files))
        await writeFile(path.join(ctx.cwd, name), content);
      yield { kind: 'completed', result: 'ok', sessionId: 's' };
    };
  }

  it('the second item starts from the first item’s merged output, and main accumulates both', async () => {
    const seen: string[][] = [];
    const base = writes({
      A: { 'package.json': passingPkg, 'a.js': 'module.exports = 1;' },
      B: { 'b.js': 'require("./a");' },
    });
    const s = await setup(async function* (ctx, n) {
      seen.push((await readdir(ctx.cwd)).filter((f) => !f.startsWith('.')).sort());
      yield* base(ctx);
      void n;
    });
    const a = await createWorkItem(app, s.projectId, { title: 'A' });
    const b = await createWorkItem(app, s.projectId, { title: 'B' });
    await request(server)
      .post(`/work-items/${b}/dependencies`)
      .send({ dependsOnWorkItemId: a })
      .expect(201);
    await assign(app, a, s.emp);
    await assign(app, b, s.emp);

    expect((await worker().runOnce())?.workItemId).toBe(a);
    expect((await evaluator().evaluate(a)).routedTo).toBe('done');
    expect((await worker().runOnce())?.workItemId).toBe(b);
    expect((await evaluator().evaluate(b)).routedTo).toBe('done'); // b's tree still has a's package.json

    expect(seen[0]).toEqual([]); // A starts from an empty project
    expect(seen[1]).toEqual(expect.arrayContaining(['a.js', 'package.json'])); // B sees A's work

    const main = await workspace().projectPath(s.projectId);
    expect(existsSync(path.join(main, 'a.js'))).toBe(true);
    expect(existsSync(path.join(main, 'b.js'))).toBe(true);
    const log = (await git('git', ['log', '--format=%s', 'main'], { cwd: main })).stdout;
    expect(log.match(/^merge forge\//gm)).toHaveLength(2);
  });

  it('work that fails evaluation is NOT merged into the deliverable', async () => {
    const s = await setup(writes({ Broken: { 'package.json': failingPkg, 'bad.js': 'x' } }));
    const id = await createWorkItem(app, s.projectId, { title: 'Broken' });
    await assign(app, id, s.emp);
    await worker().runOnce();
    expect((await evaluator().evaluate(id)).routedTo).toBe('rework');
    expect(existsSync(path.join(await workspace().projectPath(s.projectId), 'bad.js'))).toBe(false);
  });

  /** Acceptance check: the file exists in the project. */
  const fileExists = (name: string) => `node -e "require('fs').accessSync('${name}')"`;

  it('a later step that breaks an earlier step’s checks is sent back, naming the step it broke', async () => {
    const s = await setup(async function* (ctx) {
      yield { kind: 'session', sessionId: 's' } as RuntimeEvent;
      const title = ctx.task.split('\n')[0];
      if (title === 'Customers API') {
        await writeFile(path.join(ctx.cwd, 'package.json'), passingPkg);
        await writeFile(path.join(ctx.cwd, 'customers.js'), 'module.exports = [];');
      } else {
        // Observed live: a later step emptied an earlier step's routes while doing its own work.
        await unlink(path.join(ctx.cwd, 'customers.js'));
        await writeFile(path.join(ctx.cwd, 'reports.js'), 'module.exports = {};');
      }
      yield { kind: 'completed', result: 'ok', sessionId: 's' } as RuntimeEvent;
    });
    const a = await createWorkItem(app, s.projectId, { title: 'Customers API' });
    const b = await createWorkItem(app, s.projectId, { title: 'Reports' });
    await db(app)
      .update(workItems)
      .set({ acceptance: [fileExists('customers.js')] })
      .where(eq(workItems.id, a));
    await request(server)
      .post(`/work-items/${b}/dependencies`)
      .send({ dependsOnWorkItemId: a })
      .expect(201);
    await assign(app, a, s.emp);
    await assign(app, b, s.emp);

    await worker().runOnce();
    expect((await evaluator().evaluate(a)).routedTo).toBe('done');
    await worker().runOnce();
    const evaluated = await evaluator().evaluate(b);
    expect(evaluated.routedTo).toBe('rework'); // its own checks pass; the earlier step's do not

    const [latest] = await db(app).select().from(evaluations).where(eq(evaluations.workItemId, b));
    const dims = (latest.detail as { dimensions: Record<string, { output: string }> }).dimensions;
    expect(dims['regression#1'].output).toContain('finished step "Customers API"');
    const main = await workspace().projectPath(s.projectId);
    expect(existsSync(path.join(main, 'customers.js'))).toBe(true); // the break never reached main
    expect(existsSync(path.join(main, 'reports.js'))).toBe(false);
  });

  it('parallel steps are checked against what merged meanwhile, so an earlier step’s checks see its own work', async () => {
    const s = await setup(
      writes({
        Ledger: { 'package.json': passingPkg, 'ledger.js': 'module.exports = 1;' },
        Aging: { 'aging.js': 'module.exports = 2;' },
      }),
    );
    // No dependency: both start from the same empty main and run side by side.
    const a = await createWorkItem(app, s.projectId, { title: 'Ledger' });
    const b = await createWorkItem(app, s.projectId, { title: 'Aging' });
    await db(app)
      .update(workItems)
      .set({ acceptance: [fileExists('ledger.js')] })
      .where(eq(workItems.id, a));
    await assign(app, a, s.emp);
    await assign(app, b, s.emp);
    await worker().runOnce();
    await worker().runOnce();

    expect((await evaluator().evaluate(a)).routedTo).toBe('done');
    // Aging's branch never had ledger.js; checked after merging main in, Ledger's check passes.
    expect((await evaluator().evaluate(b)).routedTo).toBe('done');
    const main = await workspace().projectPath(s.projectId);
    expect(existsSync(path.join(main, 'ledger.js'))).toBe(true);
    expect(existsSync(path.join(main, 'aging.js'))).toBe(true);
  });

  it('a retry continues from its previous attempt instead of starting over', async () => {
    const s = await setup(async function* (ctx, n) {
      yield { kind: 'session', sessionId: `s${n}` } as RuntimeEvent;
      if (n === 1) {
        await writeFile(path.join(ctx.cwd, 'package.json'), failingPkg);
        await writeFile(path.join(ctx.cwd, 'draft.js'), 'first attempt');
      } else {
        // The second attempt must find the first attempt's draft and fix the build.
        const draft = await readFile(path.join(ctx.cwd, 'draft.js'), 'utf8');
        await writeFile(path.join(ctx.cwd, 'draft.js'), `${draft} + fixed`);
        await writeFile(path.join(ctx.cwd, 'package.json'), passingPkg);
      }
      yield { kind: 'completed', result: 'ok', sessionId: `s${n}` } as RuntimeEvent;
    });
    const id = await createWorkItem(app, s.projectId, { title: 'Iterate' });
    await assign(app, id, s.emp);
    await worker().runOnce();
    await evaluator().evaluate(id);
    expect(await evaluator().retryOrFail(id)).toBe('retried');
    expect((await getWorkItem(app, id)).status).toBe('assigned');
    expect((await worker().runOnce())?.status).toBe('completed');
    expect((await evaluator().evaluate(id)).routedTo).toBe('done');
    expect(
      await readFile(path.join(await workspace().projectPath(s.projectId), 'draft.js'), 'utf8'),
    ).toBe('first attempt + fixed');
  });

  it('retries up to FORGE_MAX_ATTEMPTS, then gives up and fails the item', async () => {
    process.env.FORGE_MAX_ATTEMPTS = '2';
    const s = await setup(writes({ Hopeless: { 'package.json': failingPkg } }));
    const id = await createWorkItem(app, s.projectId, { title: 'Hopeless' });
    await assign(app, id, s.emp);
    await worker().runOnce();
    await evaluator().evaluate(id);
    expect(await evaluator().retryOrFail(id)).toBe('retried');
    await worker().runOnce();
    await evaluator().evaluate(id);
    expect(await evaluator().retryOrFail(id)).toBe('failed');
    expect((await getWorkItem(app, id)).status).toBe('failed');
    expect(s.runtime.runs).toBe(2);
  });

  it('retryOrFail ignores items that are not in rework', async () => {
    const s = await setup(writes({}));
    const id = await createWorkItem(app, s.projectId, { title: 'Idle' });
    expect(await evaluator().retryOrFail(id)).toBe('skipped');
  });

  it('two independent items that edit the same file: the second cannot merge, goes to rework, and main keeps the first', async () => {
    const s = await setup(
      writes({ Left: { 'shared.txt': 'left\n' }, Right: { 'shared.txt': 'right\n' } }),
    );
    const left = await createWorkItem(app, s.projectId, { title: 'Left' });
    const right = await createWorkItem(app, s.projectId, { title: 'Right' });
    await assign(app, left, s.emp);
    await assign(app, right, s.emp);
    // No dependency: both branch from the same (empty) main before either merges.
    await worker().runOnce();
    await worker().runOnce();
    expect((await evaluator().evaluate(left)).routedTo).toBe('done');
    const r = await evaluator().evaluate(right);
    expect(r.routedTo).toBe('rework');
    expect(r.integrationConflict).toBeTruthy();
    const main = await workspace().projectPath(s.projectId);
    expect(await readFile(path.join(main, 'shared.txt'), 'utf8')).toBe('left\n');
    expect((await git('git', ['status', '--porcelain'], { cwd: main })).stdout.trim()).toBe(''); // merge aborted cleanly
  });

  it('marks the goal completed (and announces it) only when every item is done; cancelled items do not block', async () => {
    const s = await setup(writes({ One: { 'one.txt': '1' }, Two: { 'two.txt': '2' } }));
    const one = await createWorkItem(app, s.projectId, { title: 'One' });
    const two = await createWorkItem(app, s.projectId, { title: 'Two' });
    const dropped = await createWorkItem(app, s.projectId, { title: 'Dropped' });
    await request(server)
      .post(`/work-items/${dropped}/status`)
      .send({ status: 'cancelled' })
      .expect(201);
    await request(server)
      .post(`/work-items/${two}/dependencies`)
      .send({ dependsOnWorkItemId: one })
      .expect(201);
    await assign(app, one, s.emp);
    await assign(app, two, s.emp);

    await worker().runOnce();
    await evaluator().evaluate(one);
    expect((await request(server).get(`/goals/${s.goalId}`).expect(200)).body.status).not.toBe(
      'completed',
    );

    await worker().runOnce();
    await evaluator().evaluate(two);
    expect((await request(server).get(`/goals/${s.goalId}`).expect(200)).body.status).toBe(
      'completed',
    );
    const announced = await db(app)
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.aggregateId, s.goalId));
    expect(announced.map((e) => e.type)).toContain(EventTypes.GoalCompleted);
  });

  describe('planner ordering', () => {
    async function planWith(workItems: unknown[]) {
      const key = `ceo-order-${randomUUID().slice(0, 8)}`;
      app.get(RuntimeRegistry).register(
        new ScriptedRuntime(key, async function* (ctx) {
          yield { kind: 'session', sessionId: 's' } as RuntimeEvent;
          await writeFile(
            path.join(ctx.cwd, 'PLAN.json'),
            JSON.stringify({ project: 'P', workItems }),
          );
          yield { kind: 'completed', result: 'ok', sessionId: 's' } as RuntimeEvent;
        }),
      );
      const companyId = await createCompany(app);
      await createEmployee(app, companyId, { name: 'Ceo', role: 'CEO', runtimeKey: key });
      await createEmployee(app, companyId, { name: 'Dev', role: 'Engineer', runtimeKey: key });
      const goal = (
        await request(server).post(`/companies/${companyId}/goals`).send({ title: 'G' }).expect(201)
      ).body.id;
      const plan = await app.get(CeoPlanner).plan(goal);
      const deps: Record<number, number[]> = {};
      for (const [i, w] of plan.workItems.entries()) {
        const item = (await request(server).get(`/work-items/${w.workItemId}`).expect(200)).body;
        deps[i] = item.dependencies.map((d: { dependsOnWorkItemId: string }) =>
          plan.workItems.findIndex((x) => x.workItemId === d.dependsOnWorkItemId),
        );
      }
      return deps;
    }

    it('chains items in plan order by default', async () => {
      expect(await planWith([{ title: 'a' }, { title: 'b' }, { title: 'c' }])).toEqual({
        0: [],
        1: [0],
        2: [1],
      });
    });

    it('honours explicit earlier-only dependsOn, including none (independent work)', async () => {
      const deps = await planWith([
        { title: 'a' },
        { title: 'b', dependsOn: [] },
        { title: 'c', dependsOn: [0, 1] },
      ]);
      expect(deps[1]).toEqual([]);
      expect(deps[2].sort()).toEqual([0, 1]);
    });

    it('ignores forward, self and garbage references instead of creating cycles', async () => {
      const deps = await planWith([
        { title: 'a', dependsOn: [0, 1] },
        { title: 'b', dependsOn: [5, 1, 'x', 0] },
      ]);
      expect(deps[0]).toEqual([]);
      expect(deps[1]).toEqual([0]);
    });
  });
});
