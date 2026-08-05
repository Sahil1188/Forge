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
import { MemoryService } from '../src/modules/memory/memory.service';
import { AgentRuntime, RuntimeEvent, RuntimeRunContext } from '../src/modules/runtimes/runtime.port';

/** A runtime that produces a passing repo (like the perf mock). */
class MemMockRuntime implements AgentRuntime {
  readonly key = 'mock-mem';
  run(ctx: RuntimeRunContext): AsyncIterable<RuntimeEvent> {
    return (async function* () {
      yield { kind: 'session', sessionId: 's' } as RuntimeEvent;
      await writeFile(
        path.join(ctx.cwd, 'package.json'),
        JSON.stringify({ name: 'app', version: '1.0.0', scripts: { test: 'node test.js' } }),
        'utf8',
      );
      await writeFile(path.join(ctx.cwd, 'test.js'), 'process.exit(0);\n', 'utf8');
      yield { kind: 'usage', inputTokens: 10, outputTokens: 5, costUsd: 0.01 } as RuntimeEvent;
      yield { kind: 'completed', result: 'done', sessionId: 's' } as RuntimeEvent;
    })();
  }
  resume(): AsyncIterable<RuntimeEvent> {
    return this.run({} as RuntimeRunContext);
  }
}

describe('Agent memory learning loop (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    app.get(RuntimeRegistry).register(new MemMockRuntime());
  });

  afterAll(async () => {
    await app.close();
  });

  it('writes a durable memory from an evaluation and recalls it into the next run', async () => {
    const server = app.getHttpServer();
    const company = await request(server).post('/companies').send({ name: 'Mem Co' }).expect(201);
    const emp = await request(server)
      .post(`/companies/${company.body.id}/employees`)
      .send({
        name: 'Grace',
        role: 'Backend Engineer',
        runtimeConfig: { runtimeKey: 'mock-mem', modelPolicy: { default: 'm' } },
        skills: [{ skillKey: 'node', level: 50 }],
      })
      .expect(201);

    // No memories before any work.
    const before = await request(server).get(`/employees/${emp.body.id}/memories`).expect(200);
    expect(before.body).toHaveLength(0);

    // Drive a coding work item through execution + evaluation.
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
      .send({ title: 'Build the widget', taskType: 'coding', priority: 70 })
      .expect(201);
    await request(server)
      .post(`/work-items/${work.body.id}/assign`)
      .send({ employeeId: emp.body.id })
      .expect(201);

    await app.get(ExecutionWorker).runOnce();
    const evalSummary = await app.get(EvaluationWorker).evaluate(work.body.id);
    expect(evalSummary.status).toBe('passed');

    // A memory was written from the objective outcome…
    const after = await request(server).get(`/employees/${emp.body.id}/memories`).expect(200);
    expect(after.body.length).toBeGreaterThan(0);
    expect(after.body[0].content).toContain('Build the widget');
    expect(after.body[0].taskType).toBe('coding');

    // …and it surfaces in the block the next run's context would receive.
    const block = await app.get(MemoryService).recallBlock(emp.body.id, 'coding');
    expect(block).toContain('What you have learned');
    expect(block).toContain('Build the widget');
  });
});
