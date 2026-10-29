import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { RuntimeRegistry } from '../src/modules/runtimes/runtime-registry';
import { ExecutionWorker } from '../src/workers/execution.worker';
import { EvaluationWorker } from '../src/modules/evaluation/evaluation.worker';
import { CeoPlanner } from '../src/modules/heartbeats/ceo-planner.service';
import { RuntimeEvent, RuntimeRunContext } from '../src/modules/runtimes/runtime.port';
import { ScriptedRuntime, bootApp, cancelStrayWork, createCompany, createEmployee, setGovernance } from './helpers';

describe('Console API — endpoints shaped for the web UI (e2e)', () => {
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
    await cancelStrayWork(app);
  });

  /** A company whose developer builds index.js (+ a passing test script) on a scripted runtime. */
  async function builtGoal(opts: { failing?: boolean } = {}) {
    const key = `con-${randomUUID().slice(0, 6)}`;
    app.get(RuntimeRegistry).register(
      new ScriptedRuntime(key, async function* (ctx: RuntimeRunContext) {
        yield { kind: 'session', sessionId: 's' } as RuntimeEvent;
        await writeFile(path.join(ctx.cwd, 'index.js'), 'module.exports = 42;\n');
        await writeFile(
          path.join(ctx.cwd, 'package.json'),
          JSON.stringify({ name: 'x', version: '1.0.0', scripts: { test: `node -e "process.exit(${opts.failing ? 1 : 0})"` } }),
        );
        yield { kind: 'tool_use', toolName: 'Write', toolUseId: 't1', input: { file_path: 'index.js' } } as RuntimeEvent;
        yield { kind: 'usage', inputTokens: 10, outputTokens: 5, costUsd: 0.02 } as RuntimeEvent;
        yield { kind: 'completed', result: 'ok', sessionId: 's' } as RuntimeEvent;
      }),
    );
    const companyId = await createCompany(app, `Console ${key}`);
    const dev = await createEmployee(app, companyId, { name: 'Rex', role: 'Engineer', runtimeKey: key, skills: [{ skillKey: 'node', level: 70 }] });
    const goal = (
      await request(server)
        .post(`/companies/${companyId}/goals`)
        .send({ title: 'Answer', mode: 'direct', acceptance: [`node -e "require('./index.js') === 42 || process.exit(1)"`] })
        .expect(201)
    ).body;
    const plan = await app.get(CeoPlanner).plan(goal.id);
    const itemId = plan.workItems[0].workItemId;
    await app.get(ExecutionWorker).runOnce();
    await app.get(EvaluationWorker).evaluate(itemId);
    return { companyId, dev, goal, itemId, projectId: plan.projectId, key };
  }

  it('GET /system reports what can run', async () => {
    const res = await request(server).get('/system').expect(200);
    expect(res.body.runtimes.map((r: { key: string }) => r.key)).toEqual(['claude_code', 'custom:anthropic', 'custom:ollama', 'custom:openai']);
    expect(res.body.runtimes[0].available).toBe(true);
    expect(typeof res.body.version).toBe('string');
  });

  describe('starter team', () => {
    it('by default creates a full organisation: an executive per department and senior specialists', async () => {
      const companyId = await createCompany(app);
      const res = await request(server).post(`/companies/${companyId}/starter-team`).send({}).expect(201);
      const people = res.body.employees as Array<{ id: string; role: string; department: string; managerEmployeeId: string | null; description: string; skills: Array<{ level: number }>; runtimeConfig: { modelPolicy: Record<string, unknown> } }>;
      expect(people.length).toBe(21);
      expect(new Set(people.map((p) => p.department))).toEqual(
        new Set(['Leadership', 'Engineering', 'Product & Design', 'Cloud & Infrastructure', 'Security', 'Finance', 'Data', 'Operations']),
      );
      const byRole = (r: string) => people.find((p) => p.role === r)!;
      for (const r of ['Chief Financial Officer', 'Chief Information Security Officer', 'Senior Cloud Architect', 'Senior Network Engineer', 'Senior UI/UX Designer', 'Senior Frontend Engineer']) {
        expect(byRole(r), r).toBeDefined();
      }
      expect(byRole('Senior Financial Analyst').managerEmployeeId).toBe(byRole('Chief Financial Officer').id);
      expect(byRole('Chief Financial Officer').managerEmployeeId).toBe(res.body.ceo.id);
      for (const p of people) {
        expect(p.description.length).toBeGreaterThan(40);
        expect(Math.min(...p.skills.map((s) => s.level))).toBeGreaterThanOrEqual(88);
      }
      // Planners on Opus; specialists on Sonnet, stepping up to Opus for complex work.
      expect(byRole('CEO').runtimeConfig.modelPolicy).toEqual({ default: 'opus' });
      expect(byRole('Senior Backend Engineer').runtimeConfig.modelPolicy).toMatchObject({ default: 'sonnet', byComplexity: { high: 'opus', low: 'sonnet' } });
    });

    it('template "minimal" creates a CEO and an engineer who reports to them, on the chosen model', async () => {
      const companyId = await createCompany(app);
      const res = await request(server).post(`/companies/${companyId}/starter-team`).send({ model: 'claude-haiku-4-5', template: 'minimal' }).expect(201);
      expect(res.body.employees).toHaveLength(2);
      expect(res.body.ceo.role).toBe('CEO');
      expect(res.body.engineer.managerEmployeeId).toBe(res.body.ceo.id);
      expect(res.body.engineer.runtimeConfig).toMatchObject({ runtimeKey: 'claude_code', modelPolicy: { default: 'claude-haiku-4-5' } });
      expect(res.body.engineer.skills.length).toBeGreaterThan(0);
    });

    it('404s an unknown company', async () => {
      await request(server).post(`/companies/${randomUUID()}/starter-team`).send({}).expect(404);
    });
  });

  it('creating a goal with start:true returns it already active', async () => {
    const companyId = await createCompany(app);
    const res = await request(server).post(`/companies/${companyId}/goals`).send({ title: 'Go', start: true }).expect(201);
    expect(res.body.status).toBe('active');
    await request(server).post(`/companies/${companyId}/goals`).send({ title: 'x', start: 'yes' }).expect(400);
  });

  it('an acceptance check that cannot even run stops after one attempt and says so, instead of retrying', async () => {
    const key = `brk-${randomUUID().slice(0, 6)}`;
    app.get(RuntimeRegistry).register(
      new ScriptedRuntime(key, async function* (ctx: RuntimeRunContext) {
        yield { kind: 'session', sessionId: 's' } as RuntimeEvent;
        await writeFile(path.join(ctx.cwd, 'index.js'), 'module.exports = 42;\n');
        yield { kind: 'completed', result: 'ok', sessionId: 's' } as RuntimeEvent;
      }),
    );
    const companyId = await createCompany(app, `Broken ${key}`);
    await createEmployee(app, companyId, { name: 'Rex', role: 'Engineer', runtimeKey: key });
    const goal = (await request(server).post(`/companies/${companyId}/goals`).send({ title: 'Answer', mode: 'direct', acceptance: ['node -e "if(/oops"'] }).expect(201)).body;
    const plan = await app.get(CeoPlanner).plan(goal.id);
    const itemId = plan.workItems[0].workItemId;
    await app.get(ExecutionWorker).runOnce();
    await app.get(EvaluationWorker).evaluate(itemId);
    expect(await app.get(EvaluationWorker).retryOrFail(itemId)).toBe('failed');
    const item = (await request(server).get(`/goals/${goal.id}/board`)).body.items[0];
    expect(item.status).toBe('failed');
    expect(item.runs).toHaveLength(1);
    expect(item.evaluation.note).toMatch(/acceptance#1 could not run/);
  });

  describe('change requests (feedback on delivered work)', () => {
    /** A goal delivered by Rex; Rex's later runs (the change) do what `change` says. */
    async function delivered(change: (cwd: string) => Promise<void>) {
      const key = `chg-${randomUUID().slice(0, 6)}`;
      app.get(RuntimeRegistry).register(
        new ScriptedRuntime(key, async function* (ctx: RuntimeRunContext, n: number) {
          yield { kind: 'session', sessionId: `s${n}` } as RuntimeEvent;
          if (n === 1) {
            await writeFile(path.join(ctx.cwd, 'index.js'), 'module.exports = 42;\n');
            await writeFile(path.join(ctx.cwd, 'package.json'), JSON.stringify({ name: 'x', version: '1.0.0', scripts: { test: 'node -e "process.exit(0)"' } }));
          } else {
            await change(ctx.cwd);
          }
          yield { kind: 'completed', result: 'ok', sessionId: `s${n}` } as RuntimeEvent;
        }),
      );
      const companyId = await createCompany(app, `Change ${key}`);
      const dev = await createEmployee(app, companyId, { name: 'Rex', role: 'Engineer', runtimeKey: key });
      await createEmployee(app, companyId, { name: 'Other', role: 'Engineer', runtimeKey: key });
      const goal = (await request(server).post(`/companies/${companyId}/goals`).send({ title: 'Answer', mode: 'direct', acceptance: [`node -e "require('./index.js') === 42 || process.exit(1)"`] }).expect(201)).body;
      const plan = await app.get(CeoPlanner).plan(goal.id);
      const itemId = plan.workItems[0].workItemId;
      await app.get(ExecutionWorker).runOnce();
      await app.get(EvaluationWorker).evaluate(itemId);
      const repo = (await request(server).get(`/goals/${goal.id}/board`).expect(200)).body.projects[0].deliverablePath as string;
      return { goal, itemId, dev, repo };
    }

    it('a compatible change goes to the original builder, keeps every earlier check, merges, and completes the goal again', async () => {
      const d = await delivered((cwd) => writeFile(path.join(cwd, 'extra.js'), 'module.exports = "help";\n'));
      expect((await request(server).get(`/goals/${d.goal.id}/board`)).body.goal.status).toBe('completed');

      const res = await request(server).post(`/goals/${d.goal.id}/changes`).send({ feedback: 'Also add an extra.js helper', workItemId: d.itemId }).expect(201);
      expect(res.body).toMatchObject({ assignedTo: d.dev, regressionChecks: 1 });
      expect((await request(server).get(`/goals/${d.goal.id}/board`)).body.goal.status).toBe('active');

      await app.get(ExecutionWorker).runOnce();
      await app.get(EvaluationWorker).evaluate(res.body.workItemId);
      const board = (await request(server).get(`/goals/${d.goal.id}/board`)).body;
      const change = board.items.find((i: { id: string }) => i.id === res.body.workItemId);
      expect(change.status).toBe('done');
      expect(change.evaluation.dimensions.map((x: { command: string }) => x.command)).toEqual(expect.arrayContaining([`node -e "require('./index.js') === 42 || process.exit(1)"`]));
      expect(board.goal.status).toBe('completed');
      expect(await readFile(path.join(d.repo, 'extra.js'), 'utf8')).toContain('help');
      expect(await readFile(path.join(d.repo, 'index.js'), 'utf8')).toBe('module.exports = 42;\n'); // untouched
    });

    it('a change that would break an earlier requirement is caught: not merged, main untouched, sent back for rework', async () => {
      const d = await delivered((cwd) => writeFile(path.join(cwd, 'index.js'), 'module.exports = 43;\n'));
      const res = await request(server).post(`/goals/${d.goal.id}/changes`).send({ feedback: 'Return 43 instead' }).expect(201);
      await app.get(ExecutionWorker).runOnce();
      await app.get(EvaluationWorker).evaluate(res.body.workItemId);
      const change = (await request(server).get(`/goals/${d.goal.id}/board`)).body.items.find((i: { id: string }) => i.id === res.body.workItemId);
      expect(change.evaluation.status).toBe('failed');
      expect(['rework', 'assigned']).toContain(change.status);
      expect(await readFile(path.join(d.repo, 'index.js'), 'utf8')).toBe('module.exports = 42;\n');
      await request(server).post(`/work-items/${res.body.workItemId}/status`).send({ status: 'cancelled' });
    });

    it('rejects feedback for a goal with nothing delivered, or a step from another goal', async () => {
      const companyId = await createCompany(app);
      const goal = (await request(server).post(`/companies/${companyId}/goals`).send({ title: 'x' }).expect(201)).body;
      await request(server).post(`/goals/${goal.id}/changes`).send({ feedback: 'change it' }).expect(400);
      const d = await delivered(async () => undefined);
      await request(server).post(`/goals/${d.goal.id}/changes`).send({ feedback: 'change it', workItemId: randomUUID() }).expect(404);
      await request(server).post(`/goals/${d.goal.id}/changes`).send({ feedback: 'x' }).expect(400);
    });
  });

  describe('project folders', () => {
    const planDirect = async (companyId: string, body: Record<string, unknown>) => {
      const goal = await request(server).post(`/companies/${companyId}/goals`).send({ title: 'Folder test', mode: 'direct', ...body }).expect(201);
      const plan = await app.get(CeoPlanner).plan(goal.body.id);
      const board = await request(server).get(`/goals/${goal.body.id}/board`).expect(200);
      for (const w of plan.workItems) await request(server).post(`/work-items/${w.workItemId}/status`).send({ status: 'cancelled' });
      return board.body.projects[0].deliverablePath as string;
    };

    it('default: <projects root>/<company>/<project>-<id8>; the root is reported by /system', async () => {
      const companyId = await createCompany(app, 'Folder Co');
      await createEmployee(app, companyId, { name: 'Dev', role: 'Engineer' });
      const root = (await request(server).get('/system').expect(200)).body.projectsRoot as string;
      expect(root).toBe(process.env.FORGE_PROJECTS_DIR);
      const where = await planDirect(companyId, {});
      expect(path.dirname(where)).toBe(path.join(root, 'folder-co'));
      expect(path.basename(where)).toMatch(/^folder-test-[0-9a-f]{8}$/);
    });

    it('a company folder and an exact per-goal folder are honoured; occupied or unsafe folders are refused', async () => {
      const companyId = await createCompany(app, 'Custom Co');
      await createEmployee(app, companyId, { name: 'Dev', role: 'Engineer' });
      const base = await mkdtemp(path.join(os.tmpdir(), 'forge-folders-'));
      await request(server).patch(`/companies/${companyId}`).send({ projectsDir: base }).expect(200);
      expect(path.dirname(await planDirect(companyId, {}))).toBe(base);

      const exact = path.join(base, 'client-portal');
      expect(await planDirect(companyId, { location: exact })).toBe(exact);

      await writeFile(path.join(base, 'notes.txt'), 'mine');
      const occupied = await request(server).post(`/companies/${companyId}/goals`).send({ title: 'x', location: base }).expect(400);
      expect(occupied.body.message).toMatch(/not empty/);
      await request(server).post(`/companies/${companyId}/goals`).send({ title: 'x', location: 'relative/path' }).expect(400);
      await request(server).patch(`/companies/${companyId}`).send({ projectsDir: os.homedir() }).expect(400);
    });
  });

  describe('dashboard & team', () => {
    it('summarises goals with progress and cost, the team, and spend', async () => {
      const b = await builtGoal();
      const res = await request(server).get(`/companies/${b.companyId}/dashboard`).expect(200);
      expect(res.body.company.id).toBe(b.companyId);
      expect(res.body.stats).toMatchObject({ employees: 1, completedGoals: 1, activeGoals: 0, pendingApprovals: 0 });
      expect(res.body.stats.spendTotalUsd).toBeCloseTo(0.02, 10);
      expect(res.body.stats.spendTodayUsd).toBeCloseTo(0.02, 10);
      const g = res.body.goals[0];
      expect(g).toMatchObject({ id: b.goal.id, status: 'completed', mode: 'direct', items: 1, done: 1, failed: 0 });
      expect(g.costUsd).toBeCloseTo(0.02, 10);
      expect(res.body.team[0]).toMatchObject({ name: 'Rex', skills: [{ skillKey: 'node', level: expect.any(Number) }] });
      expect(res.body.team[0].latestRun.status).toBe('completed');
    });

    it('team lists runtime config and governance', async () => {
      const companyId = await createCompany(app);
      const id = await createEmployee(app, companyId, { name: 'G', role: 'Engineer', runtimeKey: 'claude_code' });
      await setGovernance(app, id, { deniedTools: ['Bash'] });
      const res = await request(server).get(`/companies/${companyId}/team`).expect(200);
      expect(res.body[0].governance).toEqual({ deniedTools: ['Bash'] });
      expect(res.body[0].runtimeConfig.runtimeKey).toBe('claude_code');
    });

    it('404s unknown companies', async () => {
      await request(server).get(`/companies/${randomUUID()}/dashboard`).expect(404);
    });
  });

  describe('goal board', () => {
    it('shows items with assignee, runs, evaluation dimensions (incl. acceptance), totals and the deliverable path', async () => {
      const b = await builtGoal();
      const res = await request(server).get(`/goals/${b.goal.id}/board`).expect(200);
      expect(res.body.planningRun).toBeNull(); // direct goal: no CEO run
      expect(res.body.projects[0].deliverablePath).toContain(b.projectId.slice(0, 8));
      const item = res.body.items[0];
      expect(item).toMatchObject({ status: 'done', assignee: { name: 'Rex' }, acceptance: [expect.stringContaining('index.js')] });
      expect(item.runs).toHaveLength(1);
      expect(item.runs[0]).toMatchObject({ status: 'completed', toolCallCount: 1 });
      expect(item.evaluation.status).toBe('passed');
      expect(item.evaluation.dimensions.map((d: { name: string }) => d.name)).toEqual(['test', 'acceptance#1']);
      expect(res.body.totals).toMatchObject({ items: 1, done: 1, failed: 0, running: 0 });
      expect(res.body.totals.costUsd).toBeCloseTo(0.02, 10);
    });

    it('a goal not yet planned has an empty board', async () => {
      const companyId = await createCompany(app);
      const g = (await request(server).post(`/companies/${companyId}/goals`).send({ title: 'later' }).expect(201)).body;
      const res = await request(server).get(`/goals/${g.id}/board`).expect(200);
      expect(res.body.items).toEqual([]);
      expect(res.body.totals.items).toBe(0);
    });

    it('404s an unknown goal', async () => {
      await request(server).get(`/goals/${randomUUID()}/board`).expect(404);
    });
  });

  describe('deliverable files', () => {
    it('lists the files on the project main and returns a file’s content', async () => {
      const b = await builtGoal();
      const list = await request(server).get(`/projects/${b.projectId}/files`).expect(200);
      expect(list.body.files.sort()).toEqual(['index.js', 'package.json']);
      const file = await request(server).get(`/projects/${b.projectId}/file`).query({ path: 'index.js' }).expect(200);
      expect(file.body).toMatchObject({ path: 'index.js', binary: false, truncated: false, content: 'module.exports = 42;\n' });
    });

    it('never serves anything outside the tracked files (no traversal, no untracked files)', async () => {
      const b = await builtGoal();
      for (const p of ['../package.json', '..\\..\\package.json', '.git/config', 'C:/Windows/win.ini', '/etc/passwd', '']) {
        await request(server).get(`/projects/${b.projectId}/file`).query({ path: p }).expect(404);
        await request(server).get(`/projects/${b.projectId}/download`).query({ path: p }).expect(404);
      }
    });

    it('downloads a deliverable file as an attachment, byte for byte', async () => {
      const b = await builtGoal();
      const res = await request(server).get(`/projects/${b.projectId}/download`).query({ path: 'index.js' }).buffer(true).expect(200);
      expect(res.headers['content-disposition']).toMatch(/^attachment; filename="index\.js"/);
      expect(res.headers['content-type']).toBe('application/octet-stream');
      expect(Buffer.from(res.body).toString('utf8')).toBe('module.exports = 42;\n');
    });

    it('a project with no work yet has no files; an unknown project is a 404', async () => {
      const companyId = await createCompany(app);
      const g = (await request(server).post(`/companies/${companyId}/goals`).send({ title: 'g' }).expect(201)).body;
      const p = (await request(server).post(`/goals/${g.id}/projects`).send({ name: 'p' }).expect(201)).body;
      expect((await request(server).get(`/projects/${p.id}/files`).expect(200)).body.files).toEqual([]);
      await request(server).get(`/projects/${randomUUID()}/files`).expect(404);
    });
  });

  it('GET /agent-runs/:id/transcript returns the redacted event stream', async () => {
    const b = await builtGoal();
    const board = (await request(server).get(`/goals/${b.goal.id}/board`).expect(200)).body;
    const runId = board.items[0].runs[0].id;
    const res = await request(server).get(`/agent-runs/${runId}/transcript`).expect(200);
    expect(res.body.events.map((e: { kind: string }) => e.kind)).toEqual(['session', 'tool_use', 'usage', 'completed']);
    await request(server).get(`/agent-runs/${randomUUID()}/transcript`).expect(404);
  });

  describe('retry', () => {
    it('sends a failed item back to work', async () => {
      const b = await builtGoal({ failing: true }); // evaluation fails → rework
      const before = (await request(server).get(`/work-items/${b.itemId}`).expect(200)).body.status;
      expect(before).toBe('rework');
      const res = await request(server).post(`/work-items/${b.itemId}/retry`).expect(201);
      expect(res.body.assignedTo).toBe(b.dev);
      expect((await request(server).get(`/work-items/${b.itemId}`).expect(200)).body.status).toBe('assigned');
      await request(server).post(`/work-items/${b.itemId}/status`).send({ status: 'cancelled' }).expect(201);
    });

    it('refuses items that are not failed or in rework', async () => {
      const b = await builtGoal();
      await request(server).post(`/work-items/${b.itemId}/retry`).expect(400);
    });
  });

  describe('approvals inbox', () => {
    it('lists pending approvals with who/what/where, scoped to the company, and drops them once decided', async () => {
      const key = `con-appr-${randomUUID().slice(0, 6)}`;
      app.get(RuntimeRegistry).register(
        new ScriptedRuntime(key, async function* (ctx) {
          yield { kind: 'session', sessionId: 's' } as RuntimeEvent;
          const d = await ctx.canUseTool!('Deploy', { env: 'prod' });
          if (d.behavior === 'pause') {
            yield { kind: 'needs_approval', toolName: 'Deploy', input: { env: 'prod' }, approvalRef: d.approvalId } as RuntimeEvent;
            return;
          }
          yield { kind: 'completed', result: 'ok', sessionId: 's' } as RuntimeEvent;
        }),
      );
      const companyId = await createCompany(app);
      const emp = await createEmployee(app, companyId, { name: 'Ops', role: 'Engineer', runtimeKey: key });
      await setGovernance(app, emp, { approvalRequiredTools: ['Deploy'] });
      const g = (await request(server).post(`/companies/${companyId}/goals`).send({ title: 'Ship', mode: 'direct' }).expect(201)).body;
      await app.get(CeoPlanner).plan(g.id);
      await app.get(ExecutionWorker).runOnce();

      const inbox = (await request(server).get(`/companies/${companyId}/approvals`).expect(200)).body;
      expect(inbox).toHaveLength(1);
      expect(inbox[0]).toMatchObject({ toolName: 'Deploy', employeeName: 'Ops', workItemTitle: 'Ship', goalId: g.id });
      expect(inbox[0].requestedAction).toEqual({ toolName: 'Deploy', input: { env: 'prod' } });

      const other = await createCompany(app);
      expect((await request(server).get(`/companies/${other}/approvals`).expect(200)).body).toEqual([]);

      await request(server).post(`/approvals/${inbox[0].id}/decision`).send({ decision: 'denied' }).expect(201);
      expect((await request(server).get(`/companies/${companyId}/approvals`).expect(200)).body).toEqual([]);
    });
  });
  describe('platform pages: overview data, runs, projects, approvals history, company settings', () => {
    it('dashboard reports success rate, 7-day activity (today last) and needs-attention items', async () => {
      const ok = await builtGoal();
      const res = await request(server).get(`/companies/${ok.companyId}/dashboard`).expect(200);
      expect(res.body.successRate).toBe(100);
      expect(res.body.activity).toHaveLength(7);
      const today = res.body.activity[6];
      expect(today.runs).toBe(1);
      expect(today.costUsd).toBeCloseTo(0.02, 10);
      expect(res.body.needsAttention).toEqual([]);

      const bad = await builtGoal({ failing: true });
      const res2 = await request(server).get(`/companies/${bad.companyId}/dashboard`).expect(200);
      expect(res2.body.successRate).toBe(0);
      expect(res2.body.needsAttention[0]).toMatchObject({ kind: 'retrying', id: bad.itemId, goalId: bad.goal.id });
      await request(server).post(`/work-items/${bad.itemId}/status`).send({ status: 'cancelled' }).expect(201);
    });

    it('a company with no evaluations has a null success rate (never a made-up number)', async () => {
      const companyId = await createCompany(app);
      expect((await request(server).get(`/companies/${companyId}/dashboard`).expect(200)).body.successRate).toBeNull();
    });

    it('lists every run in the company with who, what and where', async () => {
      const b = await builtGoal();
      const runs = (await request(server).get(`/companies/${b.companyId}/runs`).expect(200)).body;
      expect(runs).toHaveLength(1);
      expect(runs[0]).toMatchObject({ employeeName: 'Rex', kind: 'work', workItemTitle: 'Answer', goalId: b.goal.id, status: 'completed' });
      const other = await createCompany(app);
      expect((await request(server).get(`/companies/${other}/runs`).expect(200)).body).toEqual([]);
      await request(server).get(`/companies/${randomUUID()}/runs`).expect(404);
    });

    it('lists an employee’s runs', async () => {
      const b = await builtGoal();
      const runs = (await request(server).get(`/employees/${b.dev}/runs`).expect(200)).body;
      expect(runs).toHaveLength(1);
      await request(server).get(`/employees/${randomUUID()}/runs`).expect(404);
    });

    it('lists projects with goal, progress and deliverable path', async () => {
      const b = await builtGoal();
      const projects = (await request(server).get(`/companies/${b.companyId}/projects`).expect(200)).body;
      expect(projects).toHaveLength(1);
      expect(projects[0]).toMatchObject({ id: b.projectId, goalId: b.goal.id, goalTitle: 'Answer', items: 1, done: 1 });
      expect(projects[0].deliverablePath).toContain(b.projectId.slice(0, 8));
    });

    it('approvals history lists decided approvals with their decision; the default stays the pending inbox', async () => {
      const key = `con-hist-${randomUUID().slice(0, 6)}`;
      app.get(RuntimeRegistry).register(
        new ScriptedRuntime(key, async function* (ctx) {
          yield { kind: 'session', sessionId: 's' } as RuntimeEvent;
          const d = await ctx.canUseTool!('Deploy', {});
          if (d.behavior === 'pause') {
            yield { kind: 'needs_approval', toolName: 'Deploy', input: {}, approvalRef: d.approvalId } as RuntimeEvent;
            return;
          }
          yield { kind: 'completed', result: 'ok', sessionId: 's' } as RuntimeEvent;
        }),
      );
      const companyId = await createCompany(app);
      const emp = await createEmployee(app, companyId, { name: 'Ops', role: 'Engineer', runtimeKey: key });
      await setGovernance(app, emp, { approvalRequiredTools: ['Deploy'] });
      const g = (await request(server).post(`/companies/${companyId}/goals`).send({ title: 'Ship', mode: 'direct' }).expect(201)).body;
      await app.get(CeoPlanner).plan(g.id);
      await app.get(ExecutionWorker).runOnce();
      const [pending] = (await request(server).get(`/companies/${companyId}/approvals`).expect(200)).body;
      expect((await request(server).get(`/companies/${companyId}/approvals?status=decided`).expect(200)).body).toEqual([]);
      await request(server).post(`/approvals/${pending.id}/decision`).send({ decision: 'approved' }).expect(201);
      const history = (await request(server).get(`/companies/${companyId}/approvals?status=decided`).expect(200)).body;
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({ id: pending.id, status: 'approved', employeeName: 'Ops' });
      expect(history[0].decidedAt).toBeTruthy();
    });

    it('renames a company and validates the name', async () => {
      const companyId = await createCompany(app, 'Old name');
      const res = await request(server).patch(`/companies/${companyId}`).send({ name: 'New name' }).expect(200);
      expect(res.body.name).toBe('New name');
      await request(server).patch(`/companies/${companyId}`).send({ name: 'x'.repeat(201) }).expect(400);
      await request(server).patch(`/companies/${randomUUID()}`).send({ name: 'y' }).expect(404);
    });

    it('team entries carry reputation from evaluated work', async () => {
      const b = await builtGoal();
      const team = (await request(server).get(`/companies/${b.companyId}/team`).expect(200)).body;
      expect(team[0].reputation).toBe(100);
    });
  });
});
