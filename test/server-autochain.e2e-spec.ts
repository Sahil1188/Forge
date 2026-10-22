import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RuntimeRegistry } from '../src/modules/runtimes/runtime-registry';
import { ExecutionWorker } from '../src/workers/execution.worker';
import { EvaluationWorker } from '../src/modules/evaluation/evaluation.worker';
import { HeartbeatWorker } from '../src/modules/heartbeats/heartbeat.worker';
import { OutboxDispatcher } from '../src/infrastructure/events/outbox.dispatcher';
import { EventBus } from '../src/infrastructure/events/event-bus';
import { EventTypes } from '../src/infrastructure/events/event-types';
import { WORKSPACE_PORT, WorkspacePort } from '../src/modules/workspaces/workspace.port';
import { RuntimeEvent, RuntimeRunContext } from '../src/modules/runtimes/runtime.port';
import { ScriptedRuntime, bootApp, createCompany, createEmployee, sleep } from './helpers';

const pkg = (pass: boolean) =>
  JSON.stringify({ name: 'p', version: '1.0.0', scripts: { test: `node -e "process.exit(${pass ? 0 : 1})"` } });

/**
 * The `forge serve` chain, driven ONLY by events (the server's auto-triggers enabled): start a
 * goal over HTTP, then just pump the outbox. Planning → routing → ordered execution →
 * evaluation → automatic retry → merge → next item → goal completed, with nothing called by hand.
 */
describe('Server auto-chain: goal → completed with no manual driving (e2e)', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;

  beforeAll(async () => {
    app = await bootApp();
    server = app.getHttpServer();
    app.get(HeartbeatWorker).enableAutoRun();
    app.get(ExecutionWorker).enableAutoRun();
    app.get(EvaluationWorker).enableAutoRun();
  });
  afterAll(async () => {
    await app.close();
  });

  /** Pump the outbox until `done()` holds (the auto-triggers do all the work). */
  async function pumpUntil(done: () => Promise<boolean>, timeoutMs = 60_000): Promise<void> {
    const dispatcher = app.get(OutboxDispatcher);
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      await dispatcher.tick();
      if (await done()) return;
      await sleep(100);
    }
    throw new Error('auto-chain did not finish in time');
  }

  it('plans, runs items in order on one shared repo, retries a failure, merges, and completes the goal', async () => {
    const order: string[] = [];
    const ceoKey = `auto-ceo-${randomUUID().slice(0, 6)}`;
    const devKey = `auto-dev-${randomUUID().slice(0, 6)}`;
    const ceoRuntime = new ScriptedRuntime(ceoKey, async function* (ctx: RuntimeRunContext) {
      yield { kind: 'session', sessionId: 'ceo' } as RuntimeEvent;
      await writeFile(
        path.join(ctx.cwd, 'PLAN.json'),
        JSON.stringify({
          project: 'Auto',
          workItems: [
            { title: 'A', taskType: 'coding' },
            { title: 'B', taskType: 'coding' },
            { title: 'C', taskType: 'coding' },
          ],
        }),
      );
      yield { kind: 'completed', result: 'planned', sessionId: 'ceo' } as RuntimeEvent;
    });
    let bAttempts = 0;
    const devRuntime = new ScriptedRuntime(devKey, async function* (ctx: RuntimeRunContext) {
      const title = ctx.task.split('\n')[0];
      order.push(title);
      yield { kind: 'session', sessionId: title } as RuntimeEvent;
      if (title === 'A') {
        await writeFile(path.join(ctx.cwd, 'package.json'), pkg(true));
        await writeFile(path.join(ctx.cwd, 'a.js'), 'module.exports = "a";');
      } else if (title === 'B') {
        bAttempts += 1;
        // B must see A's work; its first attempt breaks the build, the retry fixes it.
        if (!existsSync(path.join(ctx.cwd, 'a.js'))) throw new Error('B did not start from A');
        await writeFile(path.join(ctx.cwd, 'b.js'), 'module.exports = "b";');
        await writeFile(path.join(ctx.cwd, 'package.json'), pkg(bAttempts > 1));
      } else {
        if (!existsSync(path.join(ctx.cwd, 'b.js'))) throw new Error('C did not start from B');
        await writeFile(path.join(ctx.cwd, 'c.js'), 'module.exports = "c";');
      }
      yield { kind: 'usage', inputTokens: 1, outputTokens: 1, costUsd: 0.001 } as RuntimeEvent;
      yield { kind: 'completed', result: 'ok', sessionId: title } as RuntimeEvent;
    });
    app.get(RuntimeRegistry).register(ceoRuntime);
    app.get(RuntimeRegistry).register(devRuntime);

    const companyId = await createCompany(app, 'Auto Co');
    const ceo = await createEmployee(app, companyId, { name: 'Ceo', role: 'CEO', runtimeKey: ceoKey });
    const dev = await createEmployee(app, companyId, {
      name: 'Dev', role: 'Engineer', runtimeKey: devKey, managerEmployeeId: ceo, skills: [{ skillKey: 'node', level: 80 }],
    });

    const goal = (await request(server).post(`/companies/${companyId}/goals`).send({ title: 'Ship A, B, C' }).expect(201)).body.id;
    await request(server).post(`/goals/${goal}/start`).expect(201);

    const goalStatus = async () => (await request(server).get(`/goals/${goal}`).expect(200)).body.status as string;
    await pumpUntil(async () => (await goalStatus()) === 'completed');

    // The whole chain happened by itself, in order, with one retry for B.
    expect(order).toEqual(['A', 'B', 'B', 'C']);
    expect(ceoRuntime.runs).toBe(1);

    const [project] = (await request(server).get(`/goals/${goal}/projects`).expect(200)).body;
    const items = (await request(server).get(`/projects/${project.id}/work-items`).expect(200)).body as Array<{
      status: string;
      assignedEmployeeId: string;
    }>;
    expect(items.every((i) => i.status === 'done')).toBe(true);
    expect(items.every((i) => i.assignedEmployeeId === dev)).toBe(true); // never the CEO

    // The deliverable on main contains everyone's work.
    const main = await app.get<WorkspacePort>(WORKSPACE_PORT).projectPath(project.id);
    for (const f of ['a.js', 'b.js', 'c.js', 'package.json']) expect(existsSync(path.join(main, f)), f).toBe(true);
    expect(existsSync(path.join(main, 'CLAUDE.md'))).toBe(false);

    // A replayed goal.started (at-least-once outbox) does not plan the goal again.
    await app.get(EventBus).publish({
      type: EventTypes.GoalStarted,
      aggregateType: 'goal',
      aggregateId: goal,
      payload: {},
      occurredAt: new Date().toISOString(),
    });
    await sleep(300);
    expect(ceoRuntime.runs).toBe(1);
    expect((await request(server).get(`/goals/${goal}/projects`).expect(200)).body).toHaveLength(1);
  }, 90_000);
});
