import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { RuntimeRegistry } from '../src/modules/runtimes/runtime-registry';
import { AgentRunsService } from '../src/modules/runtimes/agent-runs.service';
import { BudgetsService } from '../src/modules/budgets/budgets.service';
import { ApprovalsService } from '../src/modules/approvals/approvals.service';
import { MemoryService } from '../src/modules/memory/memory.service';
import { ExecutionWorker } from '../src/workers/execution.worker';
import { UsageLimits } from '../src/modules/runtimes/usage-limits';
import { EvaluationWorker, NotAwaitingEvaluationError } from '../src/modules/evaluation/evaluation.worker';
import { workspaces } from '../src/modules/workspaces/workspaces.schema';
import { RuntimeEvent, RuntimeRunContext } from '../src/modules/runtimes/runtime.port';
import {
  ScriptedRuntime,
  assign,
  bootApp,
  cancelStrayWork,
  completes,
  createCompany,
  createEmployee,
  createProject,
  createWorkItem,
  db,
  events,
  getWorkItem,
  setGovernance,
  sleep,
} from './helpers';

const git = promisify(execFile);

describe('Execution lifecycle (e2e, scripted runtimes)', () => {
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
  // A failing test must never leave runnable work behind for the next one to trip over.
  beforeEach(async () => {
    await cancelStrayWork(app);
  });

  const worker = () => app.get(ExecutionWorker);
  const runs = () => app.get(AgentRunsService);

  /** One company, one employee on a fresh scripted runtime, one assigned work item. */
  async function world(
    script: (ctx: RuntimeRunContext, n: number) => AsyncIterable<RuntimeEvent>,
    opts: { settings?: Record<string, unknown>; taskType?: string; priority?: number } = {},
  ) {
    const key = `scripted-${(seq += 1)}-${randomUUID().slice(0, 6)}`;
    const runtime = new ScriptedRuntime(key, script);
    app.get(RuntimeRegistry).register(runtime);
    const companyId = await createCompany(app, `Co ${key}`);
    const employeeId = await createEmployee(app, companyId, {
      name: 'Worker',
      role: 'Engineer',
      runtimeKey: key,
      settings: opts.settings,
    });
    const { projectId } = await createProject(app, companyId);
    const workItemId = await createWorkItem(app, projectId, { taskType: opts.taskType, priority: opts.priority });
    await assign(app, workItemId, employeeId);
    return { key, runtime, companyId, employeeId, projectId, workItemId };
  }

  const cancel = (id: string) => request(server).post(`/work-items/${id}/status`).send({ status: 'cancelled' });

  it('different employees work at the same time; one person never runs two tasks at once', async () => {
    // Each script waits until the other has started: they can only finish if they run in parallel.
    const started = new Set<string>();
    let maxConcurrentForGrace = 0;
    let graceActive = 0;
    const both = (who: string) => async function* () {
      yield { kind: 'session', sessionId: who } as RuntimeEvent;
      started.add(who);
      for (let i = 0; i < 100 && !(started.has('A') && started.has('B')); i += 1) await new Promise((r) => setTimeout(r, 50));
      if (!(started.has('A') && started.has('B'))) throw new Error('ran alone: no parallelism');
      yield { kind: 'completed', result: 'ok', sessionId: who } as RuntimeEvent;
    };
    const a = await world(both('A'));
    const b = await world(both('B'));
    // Two tasks for the same person (B's employee): must not overlap.
    const second = await createWorkItem(app, b.projectId, { title: 'second for same person' });
    app.get(RuntimeRegistry).register(
      new ScriptedRuntime(b.key, (ctx, n) =>
        n === 1
          ? both('B')()
          : (async function* () {
              graceActive += 1;
              maxConcurrentForGrace = Math.max(maxConcurrentForGrace, graceActive);
              yield { kind: 'completed', result: 'ok' } as RuntimeEvent;
              graceActive -= 1;
            })(),
      ),
    );
    await assign(app, second, b.employeeId);

    const summaries = await worker().drain();
    const byItem = new Map(summaries.map((s) => [s.workItemId, s.status]));
    expect(byItem.get(a.workItemId)).toBe('completed');
    expect(byItem.get(b.workItemId)).toBe('completed');
    expect(byItem.get(second)).toBe('completed');
    expect(maxConcurrentForGrace).toBe(1);
    for (const id of [a.workItemId, b.workItemId, second]) await cancel(id);
  });

  it('cancelling a work item stops its running agent at once and keeps the item cancelled', async () => {
    let aborted = false;
    const w = await world((ctx) =>
      (async function* () {
        yield { kind: 'session', sessionId: 'long' } as RuntimeEvent;
        // A long-running agent: only the abort signal ends it.
        await new Promise<void>((resolve) => {
          if (ctx.abortSignal?.aborted) return resolve();
          ctx.abortSignal?.addEventListener('abort', () => resolve(), { once: true });
        });
        aborted = Boolean(ctx.abortSignal?.aborted);
      })(),
    );
    const running = worker().runOnce();
    // Cancel once the agent is actually running.
    for (let i = 0; i < 100 && (await getWorkItem(app, w.workItemId)).status !== 'in_progress'; i += 1) await new Promise((r) => setTimeout(r, 100));
    await cancel(w.workItemId).expect(201);
    const summary = await running;
    expect(aborted).toBe(true);
    expect(summary?.status).toBe('failed');
    expect((await runs().findByWorkItem(w.workItemId))[0]).toMatchObject({ status: 'failed', errorJson: { message: 'Cancelled' } });
    expect((await getWorkItem(app, w.workItemId)).status).toBe('cancelled');
  });

  describe('subscription usage limits', () => {
    it('a run stopped by the usage limit is requeued, held until the reset, then runs — without spending an attempt', async () => {
      const resetsAt = Date.now() + 3_600_000;
      const w = await world((_ctx, n) =>
        n === 1
          ? events([{ kind: 'session', sessionId: 's1' }, { kind: 'rate_limit', status: 'rejected', resetsAt, limitType: 'five_hour', utilization: 1 }])
          : events([{ kind: 'completed', result: 'ok' }]),
      );
      const first = await worker().runOnce();
      expect(first?.status).toBe('rate_limited');
      expect((await runs().findOne(first!.agentRunId)).status).toBe('rate_limited');
      expect((await getWorkItem(app, w.workItemId)).status).toBe('assigned');

      // Held: the item stays queued and no new run starts while the limit is in force.
      const held = await worker().runOnce();
      expect(held).toMatchObject({ status: 'blocked', agentRunId: '' });
      const sys = await request(server).get('/system').expect(200);
      expect(sys.body.usage).toEqual(expect.arrayContaining([expect.objectContaining({ runtimeKey: w.key, status: 'rejected', resetsAt, limitType: 'five_hour' })]));

      // The limit resets → the work runs and completes.
      app.get(UsageLimits).record(w.key, { status: 'allowed' });
      const second = await worker().runOnce();
      expect(second?.status).toBe('completed');
      await cancel(w.workItemId);
    });

    it('with a fallback endpoint configured (OmniRoute/OpenRouter), work switches to it instead of waiting', async () => {
      const saved = { ...process.env };
      Object.assign(process.env, { FORGE_FALLBACK_BASE_URL: 'https://gateway.test/v1', FORGE_FALLBACK_API_KEY: 'k', FORGE_FALLBACK_MODEL: 'openrouter/auto' });
      const fetchMock = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: 'Done.' }, finish_reason: 'stop' }], usage: { prompt_tokens: 5, completion_tokens: 2, cost: 0.0001 } }), { status: 200 }));
      try {
        const companyId = await createCompany(app, 'Fallback Co');
        const employeeId = await createEmployee(app, companyId, { name: 'Grace', role: 'Engineer', runtimeKey: 'claude_code', modelPolicy: { default: 'sonnet' } });
        const { projectId } = await createProject(app, companyId);
        const workItemId = await createWorkItem(app, projectId, {});
        await assign(app, workItemId, employeeId);
        app.get(UsageLimits).record('claude_code', { status: 'rejected', resetsAt: Date.now() + 3_600_000 });

        const summary = await worker().runOnce();
        expect(summary).toMatchObject({ status: 'completed', runtimeKey: 'custom', model: 'openrouter/auto' });
        expect((await runs().findByWorkItem(workItemId))[0]).toMatchObject({ runtimeKey: 'custom', provider: 'openai', model: 'openrouter/auto', status: 'completed' });
        expect(String(fetchMock.mock.calls[0][0])).toBe('https://gateway.test/v1/chat/completions');
        await cancel(workItemId);
      } finally {
        app.get(UsageLimits).record('claude_code', { status: 'allowed' });
        process.env = saved;
        vi.restoreAllMocks();
      }
    });

    it('when the fallback cannot answer either, the work is held until the reset — never failed', async () => {
      const saved = { ...process.env };
      Object.assign(process.env, { FORGE_FALLBACK_BASE_URL: 'https://gateway.test/v1', FORGE_FALLBACK_API_KEY: 'k', FORGE_FALLBACK_MODEL: 'auto/coding' });
      const resetsAt = Date.now() + 3_600_000;
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ error: { message: 'Model is unavailable' } }), { status: 502 }));
      try {
        const companyId = await createCompany(app, 'Fallback Down Co');
        const employeeId = await createEmployee(app, companyId, { name: 'Grace', role: 'Engineer', runtimeKey: 'claude_code', modelPolicy: { default: 'sonnet' } });
        const { projectId } = await createProject(app, companyId);
        const workItemId = await createWorkItem(app, projectId, {});
        await assign(app, workItemId, employeeId);
        app.get(UsageLimits).record('claude_code', { status: 'rejected', resetsAt });

        const summary = await worker().runOnce();
        expect(summary).toMatchObject({ status: 'blocked', runtimeKey: 'custom' });
        expect((await getWorkItem(app, workItemId)).status).toBe('assigned'); // queued, not failed
        expect((await runs().findByWorkItem(workItemId))[0]).toMatchObject({ status: 'rate_limited' }); // no attempt spent
        // The broken fallback is not hammered: the next pick waits for the reset instead.
        const calls = fetchMock.mock.calls.length;
        expect(await worker().runOnce()).toMatchObject({ status: 'blocked', agentRunId: '' });
        expect(fetchMock.mock.calls.length).toBe(calls);
        await cancel(workItemId);
      } finally {
        app.get(UsageLimits).record('claude_code', { status: 'allowed' });
        app.get(UsageLimits).record('custom', { status: 'allowed' });
        process.env = saved;
        vi.restoreAllMocks();
      }
    });

    it('a usage-limit error without a structured event is recognised too', async () => {
      const w = await world(() => events([{ kind: 'failed', error: 'Claude AI usage limit reached|1761140000' }]));
      const r = await worker().runOnce();
      expect(r?.status).toBe('rate_limited');
      expect((await getWorkItem(app, w.workItemId)).status).toBe('assigned');
      app.get(UsageLimits).record(w.key, { status: 'allowed' });
      await cancel(w.workItemId);
    });
  });

  describe('failure handling', () => {
    it('a runtime that throws mid-stream fails the run and the item, records the error, and frees the worker', async () => {
      const w = await world(async function* () {
        yield { kind: 'session', sessionId: 's' } as RuntimeEvent;
        throw new Error('sdk exploded');
      });
      const summary = await worker().runOnce();
      expect(summary?.status).toBe('failed');
      const run = (await runs().findByWorkItem(w.workItemId))[0];
      expect(run.status).toBe('failed');
      expect(JSON.stringify(run.errorJson)).toContain('sdk exploded');
      expect((await getWorkItem(app, w.workItemId)).status).toBe('failed');

      // The worker is not wedged: the next item runs normally.
      const w2 = await world(async function* () {
        for (const e of completes()) yield e;
      });
      expect((await worker().runOnce())?.status).toBe('completed');
      expect((await getWorkItem(app, w2.workItemId)).status).toBe('evaluating');
    });

    it('an employee whose runtime is not registered fails cleanly with a useful message', async () => {
      const companyId = await createCompany(app);
      const emp = await createEmployee(app, companyId, { name: 'Ghost', role: 'x', runtimeKey: 'does-not-exist' });
      const { projectId } = await createProject(app, companyId);
      const wi = await createWorkItem(app, projectId);
      await assign(app, wi, emp);
      const summary = await worker().runOnce();
      expect(summary?.status).toBe('failed');
      const run = (await runs().findByWorkItem(wi))[0];
      expect(JSON.stringify(run.errorJson)).toContain('does-not-exist');
      expect((await getWorkItem(app, wi)).status).toBe('failed');
    });

    it('a failed event without completion marks the run and item failed and keeps the error text', async () => {
      const w = await world(() => events([{ kind: 'session', sessionId: 's' }, { kind: 'failed', error: 'error_during_execution' }]));
      expect((await worker().runOnce())?.status).toBe('failed');
      const run = (await runs().findByWorkItem(w.workItemId))[0];
      expect(run.status).toBe('failed');
      expect(JSON.stringify(run.errorJson)).toContain('error_during_execution');
      expect((await getWorkItem(app, w.workItemId)).status).toBe('failed');
    });

    it('running out of turns (error_max_turns) is a limit to continue from, not a failure (live bug)', async () => {
      const w = await world(() => events([{ kind: 'session', sessionId: 's' }, { kind: 'failed', error: 'error_max_turns' }]));
      await worker().runOnce();
      const run = (await runs().findByWorkItem(w.workItemId))[0];
      expect(run.status).toBe('killed_tools'); // turn and tool limits share the limit status
      expect((await getWorkItem(app, w.workItemId)).status).toBe('assigned'); // queued to continue
      await cancel(w.workItemId);
    });

    it('a stream that ends with no terminal event is a failure, not a success', async () => {
      const w = await world(() => events([{ kind: 'session', sessionId: 's' }, { kind: 'assistant_text', text: 'hmm' }]));
      expect((await worker().runOnce())?.status).toBe('failed');
      expect((await getWorkItem(app, w.workItemId)).status).toBe('failed');
    });

    it('a failed item can be re-assigned and run again (failed → assigned)', async () => {
      const w = await world((_c, n) => (n === 1 ? events([{ kind: 'failed', error: 'flaky' }]) : events(completes())));
      expect((await worker().runOnce())?.status).toBe('failed');
      await assign(app, w.workItemId, w.employeeId);
      expect((await worker().runOnce())?.status).toBe('completed');
      expect((await getWorkItem(app, w.workItemId)).status).toBe('evaluating');
      expect(await runs().findByWorkItem(w.workItemId)).toHaveLength(2);
    });
  });

  describe('circuit breakers', () => {
    it('kills a run that exceeds the tool-call ceiling', async () => {
      const w = await world(
        () =>
          events([
            { kind: 'session', sessionId: 's' },
            ...[1, 2, 3, 4].map((i) => ({ kind: 'tool_use', toolName: 'Write', toolUseId: `t${i}`, input: {} }) as RuntimeEvent),
            { kind: 'completed', result: 'never reached' },
          ]),
        { settings: { maxToolCalls: 3 } },
      );
      const summary = await worker().runOnce();
      expect(summary?.status).toBe('killed_tools');
      expect((await runs().findByWorkItem(w.workItemId))[0].status).toBe('killed_tools');
      // Retried automatically from its branch until the attempt budget (3) is spent, then failed.
      expect((await getWorkItem(app, w.workItemId)).status).toBe('assigned');
      await worker().runOnce();
      await worker().runOnce();
      expect((await runs().findByWorkItem(w.workItemId)).map((r) => r.status)).toEqual(['killed_tools', 'killed_tools', 'killed_tools']);
      expect((await getWorkItem(app, w.workItemId)).status).toBe('failed');
    });

    it('exactly at the tool ceiling is still allowed', async () => {
      const w = await world(
        () =>
          events([
            { kind: 'session', sessionId: 's' },
            ...[1, 2, 3].map((i) => ({ kind: 'tool_use', toolName: 'Write', toolUseId: `t${i}`, input: {} }) as RuntimeEvent),
            { kind: 'completed', result: 'ok' },
          ]),
        { settings: { maxToolCalls: 3 } },
      );
      expect((await worker().runOnce())?.status).toBe('completed');
      await cancel(w.workItemId);
    });

    it('a killed run is stopped promptly and its runtime generator is closed (no zombie agent)', async () => {
      let closed = false;
      await world(
        async function* () {
          try {
            yield { kind: 'session', sessionId: 's' } as RuntimeEvent;
            for (let i = 0; i < 10; i += 1) {
              yield { kind: 'tool_use', toolName: 'Write', toolUseId: `t${i}`, input: {} } as RuntimeEvent;
            }
          } finally {
            closed = true;
          }
        },
        { settings: { maxToolCalls: 1 } },
      );
      await worker().runOnce();
      expect(closed).toBe(true);
    });

    it('records the run’s cost consistently with what the budget sees (no under/over-counting)', async () => {
      const w = await world(() =>
        events([
          { kind: 'session', sessionId: 's' },
          { kind: 'usage', inputTokens: 10, outputTokens: 5, costUsd: 0.1 },
          { kind: 'usage', inputTokens: 10, outputTokens: 5, costUsd: 0.2 },
          { kind: 'completed', result: 'ok', sessionId: 's' },
        ]),
      );
      const summary = await worker().runOnce();
      const spend = await app.get(BudgetsService).spend(w.employeeId, 'total');
      const run = (await runs().findByWorkItem(w.workItemId))[0];
      expect(spend).toBeCloseTo(0.3, 10);
      expect(run.estimatedCostUsd).toBeCloseTo(spend, 10);
      expect(summary?.estimatedCostUsd).toBeCloseTo(spend, 10);
      await cancel(w.workItemId);
    });

    it('a hard-exceeded employee is blocked before any run or workspace is created', async () => {
      const w = await world(() => events(completes()));
      await request(server).put(`/employees/${w.employeeId}/budget`).send({ hardLimitUsd: 0.5, softLimitUsd: 0.4 }).expect(200);
      await app.get(BudgetsService).recordCost(null, w.employeeId, { costUsd: 0.5 });
      const summary = await worker().runOnce();
      expect(summary?.status).toBe('blocked');
      expect(w.runtime.runs).toBe(0);
      expect(await runs().findByWorkItem(w.workItemId)).toHaveLength(0);
      expect((await getWorkItem(app, w.workItemId)).status).toBe('assigned');
      await cancel(w.workItemId);
    });
  });

  describe('queue behaviour', () => {
    it('returns null when nothing is assigned', async () => {
      expect(await worker().runOnce()).toBeNull();
    });

    it('runs higher-priority work first, FIFO within a priority', async () => {
      const key = `prio-${randomUUID().slice(0, 6)}`;
      const order: string[] = [];
      app.get(RuntimeRegistry).register(
        new ScriptedRuntime(key, (ctx) => {
          order.push(ctx.workItemId);
          return events(completes());
        }),
      );
      const companyId = await createCompany(app);
      const emp = await createEmployee(app, companyId, { name: 'p', role: 'Engineer', runtimeKey: key });
      const { projectId } = await createProject(app, companyId);
      const low = await createWorkItem(app, projectId, { title: 'low', priority: 1 });
      const high = await createWorkItem(app, projectId, { title: 'high', priority: 9 });
      const mid1 = await createWorkItem(app, projectId, { title: 'mid1', priority: 5 });
      await sleep(15);
      const mid2 = await createWorkItem(app, projectId, { title: 'mid2', priority: 5 });
      for (const id of [low, mid2, high, mid1]) await assign(app, id, emp);

      for (let i = 0; i < 4; i += 1) expect((await worker().runOnce())?.status).toBe('completed');
      expect(order).toEqual([high, mid1, mid2, low]);
      expect(await worker().runOnce()).toBeNull();
    });

    it('only one run executes at a time: a concurrent runOnce returns null instead of double-driving', async () => {
      const w = await world(async function* () {
        yield { kind: 'session', sessionId: 's' } as RuntimeEvent;
        await sleep(250);
        yield { kind: 'completed', result: 'ok', sessionId: 's' } as RuntimeEvent;
      });
      const first = worker().runOnce();
      await sleep(30);
      const second = await worker().runOnce();
      expect(second).toBeNull();
      expect((await first)?.status).toBe('completed');
      expect(w.runtime.runs).toBe(1);
      await cancel(w.workItemId);
    });

    describe('drain (the auto-run loop used by `forge serve`)', () => {
      async function twoEmployeeCompany(script: Parameters<typeof world>[0]) {
        const key = `drain-${randomUUID().slice(0, 6)}`;
        const runtime = new ScriptedRuntime(key, script);
        app.get(RuntimeRegistry).register(runtime);
        const companyId = await createCompany(app);
        const a = await createEmployee(app, companyId, { name: 'A', role: 'Engineer', runtimeKey: key });
        const b = await createEmployee(app, companyId, { name: 'B', role: 'Engineer', runtimeKey: key });
        const { projectId } = await createProject(app, companyId);
        return { runtime, companyId, a, b, projectId };
      }

      it('an empty queue drains to nothing', async () => {
        expect(await worker().drain()).toEqual([]);
      });

      it('runs EVERY assigned item, not just one per trigger (live bug: 3 of 4 planned items sat assigned forever)', async () => {
        const w = await twoEmployeeCompany(() => events(completes()));
        const ids = [];
        for (const emp of [w.a, w.b, w.a, w.b]) {
          const id = await createWorkItem(app, w.projectId);
          await assign(app, id, emp);
          ids.push(id);
        }
        const summaries = await worker().drain();
        expect(summaries).toHaveLength(4);
        expect(summaries.every((s) => s.status === 'completed')).toBe(true);
        expect(new Set(summaries.map((s) => s.workItemId))).toEqual(new Set(ids));
        expect(await worker().runOnce()).toBeNull();
      });

      it('a blocked (over-budget) item neither loops forever nor starves other employees’ work', async () => {
        const w = await twoEmployeeCompany(() => events(completes()));
        await request(server).put(`/employees/${w.a}/budget`).send({ hardLimitUsd: 0.1, softLimitUsd: 0.05 }).expect(200);
        await app.get(BudgetsService).recordCost(null, w.a, { costUsd: 0.2 });
        const blocked = await createWorkItem(app, w.projectId, { priority: 99 }); // would be picked first
        const ok = await createWorkItem(app, w.projectId, { priority: 1 });
        await assign(app, blocked, w.a);
        await assign(app, ok, w.b);

        const summaries = await worker().drain();
        expect(summaries.map((s) => [s.workItemId, s.status])).toEqual([
          [blocked, 'blocked'],
          [ok, 'completed'],
        ]);
        expect((await getWorkItem(app, blocked)).status).toBe('assigned'); // still queued for when budget resets
        await cancel(blocked);
      });

      it('concurrent triggers never double-run an item, and work assigned mid-drain is still picked up', async () => {
        let assignLater: (() => Promise<void>) | undefined;
        const w = await twoEmployeeCompany(async function* (ctx) {
          if (assignLater) {
            const f = assignLater;
            assignLater = undefined;
            await f(); // a new item appears while the first is running
          }
          for (const e of completes('s')) yield e;
          void ctx;
        });
        const first = await createWorkItem(app, w.projectId, { title: 'first' });
        const late = await createWorkItem(app, w.projectId, { title: 'late' });
        await assign(app, first, w.a);
        assignLater = () => assign(app, late, w.b);

        const d1 = worker().drain();
        await sleep(20);
        const d2 = worker().drain(); // trigger while the first drain is mid-flight
        await Promise.all([d1, d2]);

        expect(w.runtime.runs).toBe(2); // each item ran exactly once
        expect((await getWorkItem(app, late)).status).toBe('evaluating');
        expect((await getWorkItem(app, first)).status).toBe('evaluating');
      });
    });

    it('does not run an item before the work it depends on is done, and runs it after', async () => {
      const key = `dep-${randomUUID().slice(0, 6)}`;
      const order: string[] = [];
      app.get(RuntimeRegistry).register(
        new ScriptedRuntime(key, (ctx) => {
          order.push(ctx.workItemId);
          return events(completes());
        }),
      );
      const companyId = await createCompany(app);
      const emp = await createEmployee(app, companyId, { name: 'd', role: 'Engineer', runtimeKey: key });
      const { projectId } = await createProject(app, companyId);
      const first = await createWorkItem(app, projectId, { title: 'first', priority: 0 });
      const second = await createWorkItem(app, projectId, { title: 'second', priority: 99 }); // more urgent, but blocked
      await request(server).post(`/work-items/${second}/dependencies`).send({ dependsOnWorkItemId: first }).expect(201);
      await assign(app, second, emp);
      await assign(app, first, emp);

      // `second` has far higher priority but must wait for `first`.
      expect((await worker().runOnce())?.workItemId).toBe(first);
      // `first` is only `evaluating`, not `done` — `second` is still blocked.
      expect(await worker().runOnce()).toBeNull();

      await app.get(EvaluationWorker).evaluate(first); // no package.json → inconclusive → done
      expect((await getWorkItem(app, first)).status).toBe('done');
      expect((await worker().runOnce())?.workItemId).toBe(second);
      expect(order).toEqual([first, second]);
    });

    it('an item whose dependency failed stays blocked rather than running on bad input', async () => {
      const key = `depfail-${randomUUID().slice(0, 6)}`;
      app.get(RuntimeRegistry).register(new ScriptedRuntime(key, () => events([{ kind: 'failed', error: 'x' }])));
      const companyId = await createCompany(app);
      const emp = await createEmployee(app, companyId, { name: 'd', role: 'Engineer', runtimeKey: key });
      const { projectId } = await createProject(app, companyId);
      const upstream = await createWorkItem(app, projectId, { title: 'upstream' });
      const downstream = await createWorkItem(app, projectId, { title: 'downstream' });
      await request(server).post(`/work-items/${downstream}/dependencies`).send({ dependsOnWorkItemId: upstream }).expect(201);
      await assign(app, upstream, emp);
      await assign(app, downstream, emp);
      expect((await worker().runOnce())?.workItemId).toBe(upstream);
      expect(await worker().runOnce()).toBeNull();
      expect((await getWorkItem(app, downstream)).status).toBe('assigned');
      await cancel(downstream);
    });
  });

  describe('workspace, artifacts and transcripts', () => {
    it('isolates each run in its own git workspace and records the output on the work item', async () => {
      const w = await world(async function* (ctx) {
        yield { kind: 'session', sessionId: 's' } as RuntimeEvent;
        await writeFile(path.join(ctx.cwd, 'a.txt'), 'A');
        await writeFile(path.join(ctx.cwd, 'b.txt'), 'B');
        yield { kind: 'completed', result: 'ok', sessionId: 's' } as RuntimeEvent;
      });
      const summary = await worker().runOnce();
      expect(summary?.filesChanged.sort()).toEqual(['a.txt', 'b.txt']);

      const wi = await getWorkItem(app, w.workItemId);
      expect(wi.artifacts).toMatchObject({ filesChanged: expect.arrayContaining(['a.txt', 'b.txt']) });
      expect(String(wi.artifacts?.branch)).toMatch(new RegExp(`^forge/${w.workItemId}-`)); // one branch per attempt

      const run = (await runs().findByWorkItem(w.workItemId))[0];
      const [ws] = await db(app).select().from(workspaces).where(eq(workspaces.id, run.workspaceId!));
      const log = (await git('git', ['log', '--format=%s'], { cwd: ws.rootPath })).stdout;
      expect(log).toContain('feat: work output');
      const branch = (await git('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: ws.rootPath })).stdout.trim();
      expect(branch).toBe(wi.artifacts?.branch);
      await cancel(w.workItemId);
    });

    it('does not commit dependency/build directories (live bug: an agent’s `npm install` put 4,367 node_modules files in the work output)', async () => {
      const w = await world(async function* (ctx) {
        yield { kind: 'session', sessionId: 's' } as RuntimeEvent;
        await writeFile(path.join(ctx.cwd, 'app.js'), 'x');
        // Forge's own per-run identity file must not end up in the deliverable either.
        await writeFile(path.join(ctx.cwd, 'CLAUDE.md'), '# Worker — identity + memories');
        for (const dir of ['node_modules/dep', 'dist', '.venv/lib', '__pycache__']) {
          await mkdir(path.join(ctx.cwd, dir), { recursive: true });
          await writeFile(path.join(ctx.cwd, dir, 'junk.js'), 'junk');
        }
        yield { kind: 'completed', result: 'ok', sessionId: 's' } as RuntimeEvent;
      });
      const summary = await worker().runOnce();
      expect(summary?.filesChanged).toEqual(['app.js']);
      await cancel(w.workItemId);
    });

    it('two runs never share a workspace', async () => {
      const a = await world(() => events(completes()));
      await worker().runOnce();
      const b = await world(() => events(completes()));
      await worker().runOnce();
      const ra = (await runs().findByWorkItem(a.workItemId))[0];
      const rb = (await runs().findByWorkItem(b.workItemId))[0];
      expect(ra.workspaceId).not.toBe(rb.workspaceId);
      await cancel(a.workItemId);
      await cancel(b.workItemId);
    });

    it('persists a redacted transcript and links it to the run', async () => {
      const w = await world(() =>
        events([
          { kind: 'session', sessionId: 's' },
          { kind: 'tool_result', toolUseId: 't', isError: false, content: 'AWS_SECRET=AKIAIOSFODNN7EXAMPLE password=hunter2hunter2' },
          { kind: 'completed', result: 'ok', sessionId: 's' },
        ]),
      );
      await worker().runOnce();
      const run = (await runs().findByWorkItem(w.workItemId))[0];
      const text = await readFile(run.transcriptRef!, 'utf8');
      expect(text).not.toContain('AKIAIOSFODNN7EXAMPLE');
      expect(text).not.toContain('hunter2hunter2');
      const lines = text.split('\n').filter(Boolean);
      expect(lines.length).toBe(3);
      // Streamed live: every event carries the time it happened.
      expect(lines.every((l) => typeof JSON.parse(l).at === 'string')).toBe(true);
      await cancel(w.workItemId);
    });

    it('hands the runtime the employee identity, task and limits', async () => {
      const w = await world(() => events(completes()), { settings: { maxTurns: 7 } });
      await worker().runOnce();
      const ctx = w.runtime.contexts[0];
      expect(ctx.systemPromptAppend).toContain('# You are Worker, Engineer');
      expect(ctx.task).toContain('Work');
      expect(ctx.limits?.maxTurns).toBe(7);
      expect(ctx.canUseTool).toBeTypeOf('function');
      await cancel(w.workItemId);
    });

    it('an employee with a written brief works under it, in cache order, with no skill numbers', async () => {
      const key = `brief-${randomUUID().slice(0, 6)}`;
      const runtime = new ScriptedRuntime(key, () => events(completes()));
      app.get(RuntimeRegistry).register(runtime);
      const companyId = await createCompany(app, `Brief Co ${key}`);
      const grace = await createEmployee(app, companyId, { name: 'Grace', role: 'Senior Backend Engineer', runtimeKey: key, skills: [{ skillKey: 'node', level: 95 }] });
      const { projectId } = await createProject(app, companyId);
      const workItemId = await createWorkItem(app, projectId, { title: 'Build the payments API' });
      await assign(app, workItemId, grace);
      await worker().runOnce();
      const prompt = runtime.contexts[0].systemPromptAppend ?? '';
      const at = (s: string) => prompt.indexOf(s);
      // Most stable first: shared rules, Forge rules, the brief, then this task's specifics last.
      expect(at('You are a senior professional at Forge')).toBe(0);
      expect(at('HOW FORGE WORKS')).toBeGreaterThan(0);
      expect(at('# You are Grace, Senior Backend Engineer')).toBeGreaterThan(at('HOW FORGE WORKS'));
      expect(at('## Current task')).toBeGreaterThan(at('# You are Grace'));
      expect(prompt).toContain('Never concatenate SQL strings with user input.');
      expect(prompt).not.toContain('node (95)');
      await cancel(workItemId);
    });
  });

  describe('governance gate wired by the worker', () => {
    async function gateWorld(governance: Record<string, unknown>) {
      const results: Array<{ tool: string; behavior: string; message?: string }> = [];
      const w = await world(async function* (ctx) {
        yield { kind: 'session', sessionId: 's' } as RuntimeEvent;
        const probes: Array<[string, unknown]> = [
          ['Read', { file_path: 'ok.txt' }],
          ['Bash', { command: 'ls' }],
          ['Write', { file_path: path.join(ctx.cwd, '..', '..', 'escape.txt') }],
          ['Write', { file_path: 'inside.txt' }],
        ];
        for (const [tool, input] of probes) {
          const d = await ctx.canUseTool!(tool, input);
          results.push({ tool, behavior: d.behavior, message: 'message' in d ? d.message : undefined });
        }
        yield { kind: 'completed', result: 'ok', sessionId: 's' } as RuntimeEvent;
      });
      await setGovernance(app, w.employeeId, governance);
      await worker().runOnce();
      await cancel(w.workItemId);
      return results;
    }

    it('allows everything by default except workspace escapes', async () => {
      const r = await gateWorld({});
      expect(r.map((x) => `${x.tool}:${x.behavior}`)).toEqual(['Read:allow', 'Bash:allow', 'Write:deny', 'Write:allow']);
      expect(r[2].message).toMatch(/outside the workspace/);
    });

    it('hands the runtime the denied and whitelisted tools for hard enforcement', async () => {
      const w = await world(() => events(completes()));
      await setGovernance(app, w.employeeId, { deniedTools: ['Bash'], allowedTools: ['Read', 'Write'] });
      await worker().runOnce();
      expect(w.runtime.contexts[0].disallowedTools).toEqual(['Bash']);
      expect(w.runtime.contexts[0].allowedTools).toEqual(['Read', 'Write']);
      await cancel(w.workItemId);
    });

    it('deniedTools denies regardless of anything else', async () => {
      const r = await gateWorld({ deniedTools: ['Bash'] });
      expect(r[1]).toMatchObject({ tool: 'Bash', behavior: 'deny' });
      expect(r[0].behavior).toBe('allow');
    });

    it('allowedTools is a strict whitelist', async () => {
      const r = await gateWorld({ allowedTools: ['Read'] });
      expect(r.map((x) => x.behavior)).toEqual(['allow', 'deny', 'deny', 'deny']);
    });

    it('approvalRequiredTools pause the run instead of allowing', async () => {
      const r = await gateWorld({ approvalRequiredTools: ['Bash'] });
      expect(r[1].behavior).toBe('pause');
    });

    it('workspace confinement cannot be granted away: an approval-required tool outside the workspace is denied, not queued', async () => {
      const r = await gateWorld({ approvalRequiredTools: ['Write'] });
      expect(r[2].behavior).toBe('deny'); // escape: denied outright
      expect(r[3].behavior).toBe('pause'); // inside: needs approval
    });
  });

  describe('approvals', () => {
    /** Asks for `Deploy` `asks` times per run; each call must be individually approved. */
    async function approvalWorld(asks = 1, withSession = true) {
      const w = await world(async function* (ctx, n) {
        if (withSession) yield { kind: 'session', sessionId: 'sess' } as RuntimeEvent;
        // A resumed session continues where it stopped: the first (n - 1) calls were already approved.
        for (let i = n - 1; i < asks; i += 1) {
          const d = await ctx.canUseTool!('Deploy', { n: i });
          if (d.behavior === 'pause') {
            yield { kind: 'needs_approval', toolName: 'Deploy', input: { n: i }, approvalRef: d.approvalId } as RuntimeEvent;
            return;
          }
          if (d.behavior === 'deny') {
            yield { kind: 'failed', error: 'denied' } as RuntimeEvent;
            return;
          }
        }
        yield { kind: 'completed', result: 'deployed', sessionId: 'sess' } as RuntimeEvent;
      });
      await setGovernance(app, w.employeeId, { approvalRequiredTools: ['Deploy'] });
      return w;
    }

    it('an approval can be decided only once (a later contradictory decision is rejected)', async () => {
      const w = await approvalWorld();
      const paused = await worker().runOnce();
      const id = paused!.approvalId!;
      await request(server).post(`/approvals/${id}/decision`).send({ decision: 'approved' }).expect(201);
      const second = await request(server).post(`/approvals/${id}/decision`).send({ decision: 'denied' });
      expect(second.status).toBe(409);
      expect((await request(server).get(`/approvals/${id}`).expect(200)).body.status).toBe('approved');
      await cancel(w.workItemId);
    });

    it('re-deciding the same way is idempotent-safe (still one decision, no duplicate outbox event)', async () => {
      const w = await approvalWorld();
      const paused = await worker().runOnce();
      const id = paused!.approvalId!;
      await request(server).post(`/approvals/${id}/decision`).send({ decision: 'approved' }).expect(201);
      const again = await request(server).post(`/approvals/${id}/decision`).send({ decision: 'approved' });
      expect([200, 201, 409]).toContain(again.status);
      expect((await request(server).get(`/approvals/${id}`).expect(200)).body.status).toBe('approved');
      await cancel(w.workItemId);
    });

    it('each approval authorises one tool call: a second call in the resumed run needs a new approval', async () => {
      const w = await approvalWorld(2);
      const first = await worker().runOnce();
      expect(first?.status).toBe('paused');
      await request(server).post(`/approvals/${first!.approvalId}/decision`).send({ decision: 'approved' }).expect(201);
      const run = (await runs().findByWorkItem(w.workItemId))[0];

      const resumed = await worker().onApprovalDecision(run.id);
      expect(resumed?.status).toBe('paused'); // first call passes (consumed), second pauses again
      expect(resumed?.approvalId).toBeTruthy();
      expect(resumed?.approvalId).not.toBe(first?.approvalId);
      expect(await app.get(ApprovalsService).findByRun(run.id)).toHaveLength(2);

      await request(server).post(`/approvals/${resumed!.approvalId}/decision`).send({ decision: 'approved' }).expect(201);
      expect((await worker().onApprovalDecision(run.id))?.status).toBe('completed');
      expect((await getWorkItem(app, w.workItemId)).status).toBe('evaluating');
      await cancel(w.workItemId).catch(() => undefined);
    });

    it('an approval is bound to the exact tool input: approving "Deploy staging" does not release "Deploy prod"', async () => {
      const w = await world(async function* (ctx, n) {
        yield { kind: 'session', sessionId: 'sess' } as RuntimeEvent;
        const env = n === 1 ? 'staging' : 'prod'; // run 1 asks for staging, the resumed run asks for prod
        const d = await ctx.canUseTool!('Deploy', { env });
        if (d.behavior === 'pause') {
          yield { kind: 'needs_approval', toolName: 'Deploy', input: { env }, approvalRef: d.approvalId } as RuntimeEvent;
          return;
        }
        yield { kind: 'completed', result: `deployed ${env}`, sessionId: 'sess' } as RuntimeEvent;
      });
      await setGovernance(app, w.employeeId, { approvalRequiredTools: ['Deploy'] });

      const first = await worker().runOnce();
      await request(server).post(`/approvals/${first!.approvalId}/decision`).send({ decision: 'approved' }).expect(201);
      const run = (await runs().findByWorkItem(w.workItemId))[0];
      const resumed = await worker().onApprovalDecision(run.id);

      expect(resumed?.status).toBe('paused'); // prod was NOT covered by the staging approval
      expect(resumed?.approvalId).not.toBe(first?.approvalId);
      const all = await app.get(ApprovalsService).findByRun(run.id);
      expect(all.map((a) => (a.requestedAction as { input: { env: string } }).input.env).sort()).toEqual(['prod', 'staging']);
    });

    it('two different pending requests for the same tool in one run get separate approvals', async () => {
      const w = await world(() => events([{ kind: 'session', sessionId: 's' }, { kind: 'completed', result: 'x' }]));
      await setGovernance(app, w.employeeId, { approvalRequiredTools: ['Deploy'] });
      const run = await runs().create({ workItemId: w.workItemId, employeeId: w.employeeId, runtimeKey: w.key });
      const svc = app.get(ApprovalsService);
      const base = { agentRunId: run.id, workItemId: w.workItemId, employeeId: w.employeeId, toolName: 'Deploy' };
      const a = await svc.requestIfAbsent({ ...base, input: { env: 'staging' } });
      const a2 = await svc.requestIfAbsent({ ...base, input: { env: 'staging' } });
      const b = await svc.requestIfAbsent({ ...base, input: { env: 'prod' } });
      expect(a2.id).toBe(a.id); // same call → deduplicated
      expect(b.id).not.toBe(a.id); // different input → distinct approval
      // Key order must not matter for equality.
      const c = await svc.requestIfAbsent({ ...base, input: { x: 1, y: 2 } });
      const c2 = await svc.requestIfAbsent({ ...base, input: { y: 2, x: 1 } });
      expect(c2.id).toBe(c.id);
    });

    it('does nothing while the approval is still pending', async () => {
      const w = await approvalWorld();
      await worker().runOnce();
      const run = (await runs().findByWorkItem(w.workItemId))[0];
      expect(await worker().onApprovalDecision(run.id)).toBeNull();
      expect((await runs().findOne(run.id)).status).toBe('needs_approval');
      await cancel(w.workItemId);
    });

    it('a decision for a run that is not paused is ignored (no double resume)', async () => {
      const w = await world(() => events(completes()));
      await worker().runOnce();
      const run = (await runs().findByWorkItem(w.workItemId))[0];
      expect(await worker().onApprovalDecision(run.id)).toBeNull();
      await cancel(w.workItemId);
    });

    it('resuming after the same decision twice only resumes once', async () => {
      const w = await approvalWorld();
      const paused = await worker().runOnce();
      await request(server).post(`/approvals/${paused!.approvalId}/decision`).send({ decision: 'approved' }).expect(201);
      const run = (await runs().findByWorkItem(w.workItemId))[0];
      expect((await worker().onApprovalDecision(run.id))?.status).toBe('completed');
      expect(await worker().onApprovalDecision(run.id)).toBeNull();
      await cancel(w.workItemId).catch(() => undefined);
    });

    it('a run that pauses without ever reporting a session is parked as needs_approval, never left "running"', async () => {
      const w = await approvalWorld(1, false);
      const paused = await worker().runOnce();
      expect(paused?.status).toBe('paused');
      const run = (await runs().findByWorkItem(w.workItemId))[0];
      expect(run.status).toBe('needs_approval');
      expect((await getWorkItem(app, w.workItemId)).status).toBe('needs_approval');
      await request(server).post(`/approvals/${paused!.approvalId}/decision`).send({ decision: 'approved' }).expect(201);
      // No session to resume from: it must fail cleanly instead of hanging forever.
      const outcome = await worker().onApprovalDecision(run.id);
      expect(outcome?.status).toBe('failed');
      expect((await getWorkItem(app, w.workItemId)).status).toBe('failed');
    });

    it('denial fails the item and resumes nothing', async () => {
      const w = await approvalWorld();
      const paused = await worker().runOnce();
      await request(server).post(`/approvals/${paused!.approvalId}/decision`).send({ decision: 'denied' }).expect(201);
      const run = (await runs().findByWorkItem(w.workItemId))[0];
      expect((await worker().onApprovalDecision(run.id))?.status).toBe('failed');
      expect(w.runtime.resumes).toBe(0);
      expect((await getWorkItem(app, w.workItemId)).status).toBe('failed');
    });

    it('an unknown run id is a 404-style error, not a silent null', async () => {
      await expect(worker().onApprovalDecision(randomUUID())).rejects.toThrow(/not found/i);
    });
  });

  describe('evaluation → rework loop (the learning cycle)', () => {
    const pkg = (passing: boolean) =>
      JSON.stringify({ name: 'x', version: '1.0.0', scripts: { test: passing ? 'node -e "process.exit(0)"' : 'node -e "process.exit(1)"' } });

    it('fail → rework → reassign → pass → done, with performance, skills and memory updated and fed into the retry', async () => {
      const w = await world(
        async function* (ctx, n) {
          yield { kind: 'session', sessionId: `s${n}` } as RuntimeEvent;
          await writeFile(path.join(ctx.cwd, 'package.json'), pkg(n >= 2));
          yield { kind: 'usage', inputTokens: 1, outputTokens: 1, costUsd: 0.01 } as RuntimeEvent;
          yield { kind: 'completed', result: 'ok', sessionId: `s${n}` } as RuntimeEvent;
        },
        { taskType: 'coding' },
      );
      const evaluator = app.get(EvaluationWorker);

      expect((await worker().runOnce())?.status).toBe('completed');
      const e1 = await evaluator.evaluate(w.workItemId);
      expect(e1).toMatchObject({ status: 'failed', routedTo: 'rework', overallScore: 0 });
      expect((await getWorkItem(app, w.workItemId)).status).toBe('rework');

      await assign(app, w.workItemId, w.employeeId); // rework → assigned
      expect((await worker().runOnce())?.status).toBe('completed');
      // The retry carries the lesson learned from the failure.
      // Specific, not generic: which check failed (the test script), not just "it failed".
      expect(w.runtime.contexts[1].systemPromptAppend).toMatch(/Mistake on "[^"]+" \(\w+\):\n- test:/);

      const e2 = await evaluator.evaluate(w.workItemId);
      expect(e2).toMatchObject({ status: 'passed', routedTo: 'done', overallScore: 100 });
      expect((await getWorkItem(app, w.workItemId)).status).toBe('done');

      expect(await runs().findByWorkItem(w.workItemId)).toHaveLength(2);
      const evals = (await request(server).get(`/work-items/${w.workItemId}/evaluations`).expect(200)).body;
      expect(evals).toHaveLength(2);

      const profile = (await request(server).get(`/employees/${w.employeeId}/profile`).expect(200)).body;
      expect(profile.recentPerformance).toHaveLength(2);
      expect(profile.reputation.samples).toBe(2);
      // Recency-weighted: a fail then a pass lands above the plain mean of 50.
      expect(profile.reputation.overall).toBeGreaterThan(50);

      const memories = await app.get(MemoryService).findByEmployee(w.employeeId);
      // Two lessons: what went wrong, then what fixed it (the most valuable kind of memory).
      expect(memories.map((m) => m.kind)).toEqual(['lesson', 'lesson']);
      expect(memories.map((m) => m.content).join('\n')).toMatch(/Fixed "[^"]+" \(\w+\) after 2 attempts\. The problem was — test:/);
    });

    it('a repo with nothing to verify is inconclusive → done, and earns no score, skill or memory', async () => {
      const w = await world(() => events(completes()));
      await worker().runOnce();
      const e = await app.get(EvaluationWorker).evaluate(w.workItemId);
      expect(e).toMatchObject({ status: 'inconclusive', overallScore: null, routedTo: 'done' });
      const profile = (await request(server).get(`/employees/${w.employeeId}/profile`).expect(200)).body;
      expect(profile.recentPerformance).toEqual([]);
      expect(await app.get(MemoryService).findByEmployee(w.employeeId)).toEqual([]);
    });

    it('refuses to evaluate an item that is not awaiting evaluation, and creates no evaluation row', async () => {
      const w = await world(() => events(completes()));
      // Still `assigned`, never ran.
      await expect(app.get(EvaluationWorker).evaluate(w.workItemId)).rejects.toBeInstanceOf(NotAwaitingEvaluationError);
      const evals = (await request(server).get(`/work-items/${w.workItemId}/evaluations`).expect(200)).body;
      expect(evals).toEqual([]);
      await cancel(w.workItemId);
    });

    it('evaluating an already-done item is rejected and records nothing extra', async () => {
      const w = await world(() => events(completes()));
      await worker().runOnce();
      await app.get(EvaluationWorker).evaluate(w.workItemId);
      await expect(app.get(EvaluationWorker).evaluate(w.workItemId)).rejects.toThrow();
      const evals = (await request(server).get(`/work-items/${w.workItemId}/evaluations`).expect(200)).body;
      expect(evals).toHaveLength(1);
    });
  });
});
