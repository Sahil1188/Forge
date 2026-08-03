import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { AppModule } from '../src/app.module';
import { RuntimeRegistry } from '../src/modules/runtimes/runtime-registry';
import { ExecutionWorker } from '../src/workers/execution.worker';
import { EvaluationWorker } from '../src/modules/evaluation/evaluation.worker';
import { AgentRuntime, RuntimeEvent, RuntimeRunContext } from '../src/modules/runtimes/runtime.port';

/** Writes a minimal Node repo whose test script passes or fails. */
class RepoMockRuntime implements AgentRuntime {
  constructor(
    readonly key: string,
    private readonly testExitCode: number,
  ) {}
  run(ctx: RuntimeRunContext): AsyncIterable<RuntimeEvent> {
    return this.gen(ctx);
  }
  resume(_sessionId: string, ctx: RuntimeRunContext): AsyncIterable<RuntimeEvent> {
    return this.gen(ctx);
  }
  private async *gen(ctx: RuntimeRunContext): AsyncIterable<RuntimeEvent> {
    yield { kind: 'session', sessionId: 's' };
    await writeFile(
      path.join(ctx.cwd, 'package.json'),
      JSON.stringify({ name: 'app', version: '1.0.0', scripts: { test: 'node test.js' } }, null, 2),
      'utf8',
    );
    await writeFile(path.join(ctx.cwd, 'test.js'), `process.exit(${this.testExitCode});\n`, 'utf8');
    yield { kind: 'tool_use', toolName: 'Write', toolUseId: 't', input: {} };
    yield { kind: 'usage', inputTokens: 5, outputTokens: 5, costUsd: 0.001 };
    yield { kind: 'completed', result: 'done', sessionId: 's' };
  }
}

describe('Evaluation Engine (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    const registry = app.get(RuntimeRegistry);
    registry.register(new RepoMockRuntime('mock-eval-pass', 0));
    registry.register(new RepoMockRuntime('mock-eval-fail', 1));
  });

  afterAll(async () => {
    await app.close();
  });

  async function runWorkItem(runtimeKey: string): Promise<string> {
    const server = app.getHttpServer();
    const company = await request(server).post('/companies').send({ name: 'Eval Co' }).expect(201);
    const emp = await request(server)
      .post(`/companies/${company.body.id}/employees`)
      .send({ name: 'Dev', role: 'Engineer', runtimeConfig: { runtimeKey, modelPolicy: { default: 'm' } } })
      .expect(201);
    const goal = await request(server)
      .post(`/companies/${company.body.id}/goals`)
      .send({ title: 'G' })
      .expect(201);
    const project = await request(server)
      .post(`/goals/${goal.body.id}/projects`)
      .send({ name: 'P' })
      .expect(201);
    const work = await request(server)
      .post(`/projects/${project.body.id}/work-items`)
      .send({ title: 'Build app', taskType: 'coding' })
      .expect(201);
    await request(server)
      .post(`/work-items/${work.body.id}/assign`)
      .send({ employeeId: emp.body.id })
      .expect(201);

    const exec = await app.get(ExecutionWorker).runOnce();
    expect(exec?.status).toBe('completed');
    return work.body.id;
  }

  it('passes evaluation and routes the work item to done', async () => {
    const workId = await runWorkItem('mock-eval-pass');
    const summary = await app.get(EvaluationWorker).evaluate(workId);

    expect(summary.status).toBe('passed');
    expect(summary.overallScore).toBe(100);
    expect(summary.routedTo).toBe('done');

    const wi = await request(app.getHttpServer()).get(`/work-items/${workId}`).expect(200);
    expect(wi.body.status).toBe('done');

    const evals = await request(app.getHttpServer())
      .get(`/work-items/${workId}/evaluations`)
      .expect(200);
    expect(evals.body[0].status).toBe('passed');
    expect(evals.body[0].detail.dimensions.test.exitCode).toBe(0);
  });

  it('fails evaluation and routes the work item to rework', async () => {
    const workId = await runWorkItem('mock-eval-fail');
    const summary = await app.get(EvaluationWorker).evaluate(workId);

    expect(summary.status).toBe('failed');
    expect(summary.routedTo).toBe('rework');

    const wi = await request(app.getHttpServer()).get(`/work-items/${workId}`).expect(200);
    expect(wi.body.status).toBe('rework');
  });
});
