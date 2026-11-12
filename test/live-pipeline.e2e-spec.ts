import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AgentRunsService } from '../src/modules/runtimes/agent-runs.service';
import { BudgetsService } from '../src/modules/budgets/budgets.service';
import { ApprovalsService } from '../src/modules/approvals/approvals.service';
import { HeartbeatWorker } from '../src/modules/heartbeats/heartbeat.worker';
import { ExecutionWorker } from '../src/workers/execution.worker';
import { EvaluationWorker } from '../src/modules/evaluation/evaluation.worker';
import { workspaces } from '../src/modules/workspaces/workspaces.schema';
import {
  assign,
  bootApp,
  cancelStrayWork,
  createCompany,
  createEmployee,
  createProject,
  createWorkItem,
  db,
  getWorkItem,
  setGovernance,
} from './helpers';

const run = promisify(execFile);

/**
 * LIVE: drives the real Claude Agent SDK through the whole Forge pipeline (no mocks).
 * Opt in with FORGE_LIVE=1. Uses the Claude Code SUBSCRIPTION login (or CLAUDE_CODE_OAUTH_TOKEN) —
 * never ANTHROPIC_API_KEY (the runtime strips it). Uses Haiku to keep cost small.
 */
const live = process.env.FORGE_LIVE === '1';
const MODEL = 'claude-haiku-4-5';

describe.skipIf(!live)('LIVE — real Claude Code builds software through Forge', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;

  beforeAll(async () => {
    expect(
      process.env.ANTHROPIC_API_KEY,
      'ANTHROPIC_API_KEY must not be set (billing rule)',
    ).toBeUndefined();
    app = await bootApp();
    server = app.getHttpServer();
  });
  afterAll(async () => {
    await app.close();
  });
  // Planned-but-unrun items from one test must never be picked up by the next.
  beforeEach(async () => {
    await cancelStrayWork(app);
  });

  async function workspaceOf(workItemId: string): Promise<string> {
    const run0 = (await app.get(AgentRunsService).findByWorkItem(workItemId))[0];
    const [ws] = await db(app)
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, run0.workspaceId!));
    return ws.rootPath;
  }

  it('CEO plans a goal → dev builds it → objective evaluation passes → independent check of the produced code', async () => {
    const companyId = await createCompany(app, 'Live Co');
    const ceo = await createEmployee(app, companyId, {
      name: 'Ada',
      role: 'CEO',
      runtimeKey: 'claude_code',
      modelPolicy: { default: MODEL },
      settings: { maxTurns: 12 },
    });
    const dev = await createEmployee(app, companyId, {
      name: 'Grace',
      role: 'Backend Engineer',
      managerEmployeeId: ceo,
      runtimeKey: 'claude_code',
      modelPolicy: { default: MODEL },
      settings: { maxTurns: 25 },
      skills: [{ skillKey: 'node', level: 80 }],
    });

    const goal = await request(server)
      .post(`/companies/${companyId}/goals`)
      .send({
        title: 'Create a tiny Node.js slugify library',
        description:
          'Plan EXACTLY ONE work item. The deliverable: slugify.js exporting slugify(str) that lowercases, ' +
          'replaces runs of non-alphanumeric characters with a single hyphen and trims leading/trailing hyphens; ' +
          'a package.json whose "test" script is "node test.js"; and test.js that checks slugify and exits non-zero on failure. ' +
          'No dependencies.',
      })
      .expect(201);
    await request(server).post(`/goals/${goal.body.id}/start`).expect(201);

    // 1) Real CEO planning (Claude Code writes PLAN.json).
    const plan = await app.get(HeartbeatWorker).onGoalStarted(goal.body.id);
    expect(plan, 'CEO produced a plan').not.toBeNull();
    expect(plan!.workItems.length).toBeGreaterThanOrEqual(1);
    const ceoRun = await app.get(AgentRunsService).findOne(plan!.ceoRunId);
    expect(ceoRun.status).toBe('completed');
    expect(ceoRun.model).toBe(MODEL);
    expect(plan!.workItems.every((w) => w.assignedTo)).toBe(true);

    // The real CEO decides how to slice the goal (it may well ignore "exactly one"). Each work item
    // gets its OWN fresh workspace today, so slices that depend on each other cannot build on one
    // another — a known architectural gap. Park the CEO's slices and hand the developer one complete,
    // self-contained work item so this test verifies real execution + evaluation, not the CEO's slicing.
    await cancelStrayWork(app);
    const { projectId } = await createProject(app, companyId);
    const itemId = await createWorkItem(app, projectId, {
      title: 'Implement the slugify library',
      description:
        'In the working directory create: (1) slugify.js exporting slugify(str) that lowercases, replaces runs of ' +
        'non-alphanumeric characters with a single hyphen and trims leading/trailing hyphens (empty string stays empty); ' +
        '(2) test.js that requires ./slugify, asserts several cases and calls process.exit(1) on any failure; ' +
        '(3) package.json with "scripts": {"test": "node test.js"}. No dependencies. Run `npm test` to confirm it passes.',
      taskType: 'coding',
    });
    await assign(app, itemId, dev);

    // 2) Real developer execution + real objective evaluation.
    const worker = app.get(ExecutionWorker);
    const evaluator = app.get(EvaluationWorker);
    const summary = await worker.runOnce();
    expect(summary?.workItemId).toBe(itemId);
    expect(summary?.status, JSON.stringify(summary)).toBe('completed');
    expect(summary?.runtimeKey).toBe('claude_code');
    const ev = await evaluator.evaluate(itemId);
    expect(ev.status, JSON.stringify(ev)).toBe('passed'); // the project's own `npm test` really passed
    expect(ev.routedTo).toBe('done');
    const done = [itemId];
    for (const id of done) expect((await getWorkItem(app, id)).status).toBe('done');

    // 3) Verify the code independently of the agent's own test.
    const root = await workspaceOf(done[0]);
    expect(existsSync(path.join(root, 'slugify.js')), `files: ${await readdir(root)}`).toBe(true);
    const { stdout } = await run(
      process.execPath,
      // Accept either `module.exports = slugify` or `module.exports = { slugify }`.
      [
        '-e',
        "const m=require('./slugify'); const slugify=typeof m==='function'?m:m.slugify; console.log(JSON.stringify([slugify('Hello, World!'), slugify('  --Foo   Bar__Baz-- '), slugify('')]))",
      ],
      { cwd: root },
    );
    const [a, b, c] = JSON.parse(stdout.trim());
    expect(a).toBe('hello-world');
    expect(b).toBe('foo-bar-baz');
    expect(c).toBe('');

    // 4) Everything stayed in the workspace: the agent did not write into the home dir or repo root.
    expect(existsSync(path.join(os.homedir(), 'slugify.js'))).toBe(false);
    expect(existsSync(path.join(process.cwd(), 'slugify.js'))).toBe(false);

    // 5) Money is accounted for, consistently, for both employees.
    for (const id of [ceo, dev]) {
      const spend = await app.get(BudgetsService).spend(id, 'total');
      expect(spend, `spend for ${id}`).toBeGreaterThan(0);
    }
    const devRun = (await app.get(AgentRunsService).findByWorkItem(done[0]))[0];
    expect(devRun.toolCallCount).toBeGreaterThan(0);
    expect(devRun.transcriptRef).toBeTruthy();
    expect(await readFile(devRun.transcriptRef!, 'utf8')).toContain('"kind":"completed"');

    // 6) The learning loop closed: performance, skill growth and memory exist.
    const profile = (await request(server).get(`/employees/${dev}/profile`).expect(200)).body;
    expect(profile.reputation.overall).toBe(100);
    expect(
      await request(server)
        .get(`/employees/${dev}/memories`)
        .expect(200)
        .then((r) => r.body.length),
    ).toBeGreaterThanOrEqual(1);
  }, 900_000);

  it('real SDK permission gate: an approval-required tool pauses the live run, then resumes the same session once approved', async () => {
    const companyId = await createCompany(app, 'Live Approval Co');
    const emp = await createEmployee(app, companyId, {
      name: 'Gated',
      role: 'Engineer',
      runtimeKey: 'claude_code',
      modelPolicy: { default: MODEL },
      settings: { maxTurns: 10 },
    });
    await setGovernance(app, emp, { approvalRequiredTools: ['Write'] });
    const { projectId } = await createProject(app, companyId);
    const wi = await createWorkItem(app, projectId, {
      title: 'Create approved.txt',
      description:
        'Create a file named approved.txt in the working directory containing exactly: gate-ok',
      taskType: 'coding',
    });
    await assign(app, wi, emp);

    const worker = app.get(ExecutionWorker);
    let outcome = await worker.runOnce();
    const approvals = app.get(ApprovalsService);
    const runs = app.get(AgentRunsService);
    const runId = outcome!.agentRunId;

    // The real model may need more than one approval (e.g. it re-words the call): approve each, bounded.
    let rounds = 0;
    while (outcome?.status === 'paused' && rounds < 4) {
      rounds += 1;
      expect((await runs.findOne(runId)).status).toBe('needs_approval');
      expect((await getWorkItem(app, wi)).status).toBe('needs_approval');
      const pending = await approvals.latestForRun(runId);
      expect(pending?.status).toBe('pending');
      expect(pending?.toolName).toBe('Write');
      // Nothing was written while the approval was outstanding.
      const root = await workspaceOf(wi);
      expect(existsSync(path.join(root, 'approved.txt'))).toBe(false);

      await request(server)
        .post(`/approvals/${pending!.id}/decision`)
        .send({ decision: 'approved' })
        .expect(201);
      outcome = await worker.onApprovalDecision(runId);
    }

    expect(outcome?.status, `after ${rounds} approval round(s): ${JSON.stringify(outcome)}`).toBe(
      'completed',
    );
    expect(rounds).toBeGreaterThanOrEqual(1);
    const root = await workspaceOf(wi);
    expect((await readFile(path.join(root, 'approved.txt'), 'utf8')).trim()).toBe('gate-ok');
    expect((await runs.findOne(runId)).sessionId).toBeTruthy(); // resumed the same session
    expect((await getWorkItem(app, wi)).status).toBe('evaluating');
  }, 900_000);

  it('real SDK: an approval-required Bash pauses even for a "safe" command like `node --version` (no auto-approve bypass)', async () => {
    const companyId = await createCompany(app, 'Live Bash Gate Co');
    const emp = await createEmployee(app, companyId, {
      name: 'BashGated',
      role: 'Engineer',
      runtimeKey: 'claude_code',
      modelPolicy: { default: MODEL },
      settings: { maxTurns: 8 },
    });
    await setGovernance(app, emp, { approvalRequiredTools: ['Bash'] });
    const { projectId } = await createProject(app, companyId);
    const wi = await createWorkItem(app, projectId, {
      title: 'Report the node version',
      description: 'Run `node --version` with the Bash tool and write the output to version.txt.',
      taskType: 'coding',
    });
    await assign(app, wi, emp);

    const outcome = await app.get(ExecutionWorker).runOnce();
    expect(outcome?.workItemId).toBe(wi);
    expect(outcome?.status, JSON.stringify(outcome)).toBe('paused');
    const pending = await app.get(ApprovalsService).latestForRun(outcome!.agentRunId);
    expect(pending).toMatchObject({ toolName: 'Bash', status: 'pending' });
    // The command must not have executed while approval was outstanding.
    const root = await workspaceOf(wi);
    expect(existsSync(path.join(root, 'version.txt'))).toBe(false);
  }, 600_000);

  it('real SDK denial: a denied tool is blocked by the gate while the agent can still finish by other means', async () => {
    const companyId = await createCompany(app, 'Live Deny Co');
    const emp = await createEmployee(app, companyId, {
      name: 'Restricted',
      role: 'Engineer',
      runtimeKey: 'claude_code',
      modelPolicy: { default: MODEL },
      settings: { maxTurns: 12 },
    });
    await setGovernance(app, emp, { deniedTools: ['Bash'] });
    const { projectId } = await createProject(app, companyId);
    const wi = await createWorkItem(app, projectId, {
      title: 'Print the node version',
      description:
        'Run `node --version` using the Bash tool and write the output to version.txt. ' +
        'If Bash is not permitted, instead write the single line "bash-denied" to version.txt.',
      taskType: 'coding',
    });
    await assign(app, wi, emp);

    const summary = await app.get(ExecutionWorker).runOnce();
    expect(summary?.status).toBe('completed');
    const root = await workspaceOf(wi);
    const text = (await readFile(path.join(root, 'version.txt'), 'utf8')).trim();
    // Bash was denied by Forge's gate, so the real node version can never have been produced via Bash.
    expect(text).toMatch(/bash-denied|denied|not permitted/i);
    expect(text).not.toMatch(/^v\d+\.\d+\.\d+/);
  }, 600_000);
});
