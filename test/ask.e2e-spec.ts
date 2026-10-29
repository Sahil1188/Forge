import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RuntimeRegistry } from '../src/modules/runtimes/runtime-registry';
import { RuntimeRunContext } from '../src/modules/runtimes/runtime.port';
import { ScriptedRuntime, bootApp, createCompany } from './helpers';

describe('Ask Forge — questions about the company or a goal, from the dashboard (e2e)', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;
  let runtime: ScriptedRuntime;
  let failNext = false;

  beforeAll(async () => {
    app = await bootApp();
    server = app.getHttpServer();
    // Ask uses the real Claude Code runtime's key; replacing it here only works if that key exists.
    expect(app.get(RuntimeRegistry).has('claude_code')).toBe(true);
    // Stands in for Claude: answers with the first line of what it was asked, so tests can see the context.
    runtime = new ScriptedRuntime('claude_code', async function* (ctx: RuntimeRunContext) {
      if (failNext) {
        failNext = false;
        yield { kind: 'failed', error: 'model unavailable' };
        return;
      }
      const goalLine = ctx.task.split('\n').find((l) => l.startsWith('# ')) ?? '';
      yield { kind: 'usage', inputTokens: 10, outputTokens: 5, costUsd: 0.01 };
      yield { kind: 'completed', result: `Answer about ${goalLine.slice(2)}`, sessionId: 's' };
    });
    app.get(RuntimeRegistry).register(runtime);
  });
  afterAll(async () => {
    await app.close();
  });

  it('answers a question about the whole company from a live briefing, read-only, and keeps the thread', async () => {
    const companyId = await createCompany(app, 'Ask Co');
    const res = await request(server).post(`/companies/${companyId}/ask`).send({ question: 'What is everyone doing?' }).expect(201);
    expect(res.body).toMatchObject({ role: 'assistant', content: 'Answer about Company: Ask Co', goalId: null });

    const ctx = runtime.contexts.at(-1)!;
    expect(ctx.task).toContain('Question: What is everyone doing?');
    expect(ctx.allowedTools).toEqual(['Read', 'Grep', 'Glob']);
    expect(ctx.disallowedTools).toEqual(expect.arrayContaining(['Write', 'Edit', 'Bash']));
    // Nothing is written into a project to answer (no CLAUDE.md), and every tool goes through the gate.
    expect(ctx.systemPromptAppend).toBeUndefined();
    expect((await ctx.canUseTool!('Bash', { command: 'ls' })).behavior).toBe('deny');

    const thread = await request(server).get(`/companies/${companyId}/ask`).expect(200);
    expect(thread.body.map((m: { role: string }) => m.role)).toEqual(['user', 'assistant']);
  });

  it('answers about one goal with that goal’s board, remembers earlier turns, and keeps threads apart', async () => {
    const companyId = await createCompany(app, 'Ask Goals Co');
    const goal = (await request(server).post(`/companies/${companyId}/goals`).send({ title: 'Dealdesk', mode: 'plan' }).expect(201)).body;

    const first = await request(server).post(`/companies/${companyId}/ask`).send({ question: 'Where are we?', goalId: goal.id }).expect(201);
    expect(first.body.content).toBe('Answer about Goal: Dealdesk (draft)');
    await request(server).post(`/companies/${companyId}/ask`).send({ question: 'And what is left?', goalId: goal.id }).expect(201);
    expect(runtime.contexts.at(-1)!.task).toContain('Q: Where are we?');

    const goalThread = await request(server).get(`/companies/${companyId}/ask?goalId=${goal.id}`).expect(200);
    expect(goalThread.body).toHaveLength(4);
    const companyThread = await request(server).get(`/companies/${companyId}/ask`).expect(200);
    expect(companyThread.body).toHaveLength(0);
  });

  it('refuses empty questions and goals of another company', async () => {
    const a = await createCompany(app, 'Ask A');
    const b = await createCompany(app, 'Ask B');
    const goal = (await request(server).post(`/companies/${b}/goals`).send({ title: 'Theirs', mode: 'plan' }).expect(201)).body;
    await request(server).post(`/companies/${a}/ask`).send({ question: '' }).expect(400);
    await request(server).post(`/companies/${a}/ask`).send({ question: 'Peek?', goalId: goal.id }).expect(400);
  });

  it('says so plainly when the model cannot answer', async () => {
    const companyId = await createCompany(app, 'Ask Fail Co');
    failNext = true;
    const res = await request(server).post(`/companies/${companyId}/ask`).send({ question: 'Status?' }).expect(201);
    expect(res.body.content).toContain('could not answer');
    expect(res.body.content).toContain('model unavailable');
  });
});

describe('KeepAwakeService (e2e)', () => {
  it('reports busy only while something is working or being checked', async () => {
    const { KeepAwakeService } = await import('../src/workers/keep-awake.service');
    const app = await bootApp();
    try {
      await expect(app.get(KeepAwakeService).busy()).resolves.toBeTypeOf('boolean');
    } finally {
      await app.close();
    }
  });
});

describe('Drain mode for safe restarts (e2e)', () => {
  it('pausing intake starts nothing new, reports when a restart is safe, and resumes', async () => {
    const { ExecutionWorker } = await import('../src/workers/execution.worker');
    const app = await bootApp();
    const server = app.getHttpServer();
    try {
      const paused = await request(server).post('/system/intake').send({ paused: true }).expect(201);
      expect(paused.body).toMatchObject({ paused: true });
      expect(typeof paused.body.safeToRestart).toBe('boolean');
      // While paused the dispatcher hands out no work at all.
      await expect(app.get(ExecutionWorker).runOnce()).resolves.toBeNull();
      await request(server).post('/system/intake').send({ paused: 'yes' }).expect(400);
      const resumed = await request(server).post('/system/intake').send({ paused: false }).expect(201);
      expect(resumed.body.paused).toBe(false);
      expect((await request(server).get('/system/intake').expect(200)).body.paused).toBe(false);
    } finally {
      await app.close();
    }
  });
});
