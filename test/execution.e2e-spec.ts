import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { AppModule } from '../src/app.module';
import { RuntimeRegistry } from '../src/modules/runtimes/runtime-registry';
import { AgentRunsService } from '../src/modules/runtimes/agent-runs.service';
import { ExecutionWorker } from '../src/workers/execution.worker';
import {
  AgentRuntime,
  RuntimeEvent,
  RuntimeRunContext,
} from '../src/modules/runtimes/runtime.port';

/**
 * A mock runtime that writes a real file into the workspace and emits a normal
 * event stream — lets us exercise the full execution/persistence pipeline
 * without the Claude Agent SDK or any credentials.
 */
class MockRuntime implements AgentRuntime {
  readonly key = 'mock';
  run(ctx: RuntimeRunContext): AsyncIterable<RuntimeEvent> {
    return (async function* () {
      yield { kind: 'session', sessionId: 'mock-sess' } as RuntimeEvent;
      yield { kind: 'assistant_text', text: 'writing app' } as RuntimeEvent;
      await writeFile(path.join(ctx.cwd, 'index.js'), 'console.log("hi");\n', 'utf8');
      yield {
        kind: 'tool_use',
        toolName: 'Write',
        toolUseId: 't1',
        input: { path: 'index.js' },
      } as RuntimeEvent;
      yield { kind: 'usage', inputTokens: 120, outputTokens: 60, costUsd: 0.012 } as RuntimeEvent;
      yield { kind: 'completed', result: 'done', sessionId: 'mock-sess' } as RuntimeEvent;
    })();
  }
  resume(): AsyncIterable<RuntimeEvent> {
    return this.run({} as RuntimeRunContext);
  }
}

describe('Execution pipeline (e2e, mock runtime)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    app.get(RuntimeRegistry).register(new MockRuntime());
  });

  afterAll(async () => {
    await app.close();
  });

  it('runs an assigned work item end-to-end and records the agent run', async () => {
    const server = app.getHttpServer();

    const company = await request(server).post('/companies').send({ name: 'Exec Co' }).expect(201);
    const emp = await request(server)
      .post(`/companies/${company.body.id}/employees`)
      .send({
        name: 'Grace',
        role: 'Backend Engineer',
        runtimeConfig: { runtimeKey: 'mock', modelPolicy: { default: 'mock-model' } },
      })
      .expect(201);
    const goal = await request(server)
      .post(`/companies/${company.body.id}/goals`)
      .send({ title: 'Build app' })
      .expect(201);
    const project = await request(server)
      .post(`/goals/${goal.body.id}/projects`)
      .send({ name: 'Engineering' })
      .expect(201);
    const work = await request(server)
      .post(`/projects/${project.body.id}/work-items`)
      .send({ title: 'Scaffold index.js', taskType: 'coding' })
      .expect(201);
    await request(server)
      .post(`/work-items/${work.body.id}/assign`)
      .send({ employeeId: emp.body.id })
      .expect(201);

    const worker = app.get(ExecutionWorker);
    const summary = await worker.runOnce();

    expect(summary).not.toBeNull();
    expect(summary?.status).toBe('completed');
    expect(summary?.runtimeKey).toBe('mock');
    expect(summary?.model).toBe('mock-model');
    expect(summary?.filesChanged).toContain('index.js');

    // The work item advanced to evaluating with artifacts recorded.
    const refetched = await request(server).get(`/work-items/${work.body.id}`).expect(200);
    expect(refetched.body.status).toBe('evaluating');
    // One branch per attempt, off the project's shared repo.
    expect(refetched.body.artifacts.branch).toMatch(new RegExp(`^forge/${work.body.id}-`));

    // The agent run captured usage + cost + session.
    const runs = await app.get(AgentRunsService).findByWorkItem(work.body.id);
    expect(runs).toHaveLength(1);
    expect(runs[0].status).toBe('completed');
    expect(runs[0].sessionId).toBe('mock-sess');
    expect(runs[0].inputTokens).toBe(120);
    expect(runs[0].estimatedCostUsd).toBeCloseTo(0.012, 5);
    expect(runs[0].toolCallCount).toBe(1);
    expect(runs[0].filesChangedCount).toBeGreaterThanOrEqual(1);
  });

  it('returns null when no work is assigned', async () => {
    // Drain any assigned items first, then confirm idle.
    const worker = app.get(ExecutionWorker);
    let guard = 0;
    while ((await worker.runOnce()) !== null && guard < 5) guard += 1;
    expect(await worker.runOnce()).toBeNull();
  });
});
