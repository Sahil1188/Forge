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
import {
  AgentRuntime,
  RuntimeEvent,
  RuntimeRunContext,
} from '../src/modules/runtimes/runtime.port';

/** Writes a minimal Node repo with a passing test. */
class PerfMockRuntime implements AgentRuntime {
  readonly key = 'mock-perf';
  run(ctx: RuntimeRunContext): AsyncIterable<RuntimeEvent> {
    return (async function* () {
      yield { kind: 'session', sessionId: 's' } as RuntimeEvent;
      await writeFile(
        path.join(ctx.cwd, 'package.json'),
        JSON.stringify({ name: 'app', version: '1.0.0', scripts: { test: 'node test.js' } }),
        'utf8',
      );
      await writeFile(path.join(ctx.cwd, 'test.js'), 'process.exit(0);\n', 'utf8');
      yield { kind: 'usage', inputTokens: 10, outputTokens: 5, costUsd: 0.02 } as RuntimeEvent;
      yield { kind: 'completed', result: 'done', sessionId: 's' } as RuntimeEvent;
    })();
  }
  resume(): AsyncIterable<RuntimeEvent> {
    return this.run({} as RuntimeRunContext);
  }
}

describe('Performance & reputation (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    app.get(RuntimeRegistry).register(new PerfMockRuntime());
  });

  afterAll(async () => {
    await app.close();
  });

  it('records performance from evaluation and updates the computed profile', async () => {
    const server = app.getHttpServer();
    const company = await request(server).post('/companies').send({ name: 'Perf Co' }).expect(201);
    const emp = await request(server)
      .post(`/companies/${company.body.id}/employees`)
      .send({
        name: 'Grace',
        role: 'Backend Engineer',
        runtimeConfig: { runtimeKey: 'mock-perf', modelPolicy: { default: 'm' } },
        skills: [{ skillKey: 'node', level: 50 }],
      })
      .expect(201);

    // Baseline profile: no history yet.
    const before = await request(server).get(`/employees/${emp.body.id}/profile`).expect(200);
    expect(before.body.reputation.overall).toBeNull();
    expect(before.body.recentPerformance).toHaveLength(0);

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
      .send({ title: 'Build feature', taskType: 'coding', priority: 80 })
      .expect(201);
    await request(server)
      .post(`/work-items/${work.body.id}/assign`)
      .send({ employeeId: emp.body.id })
      .expect(201);

    await app.get(ExecutionWorker).runOnce();
    const evalSummary = await app.get(EvaluationWorker).evaluate(work.body.id);
    expect(evalSummary.status).toBe('passed');

    // Profile now reflects the objective result.
    const after = await request(server).get(`/employees/${emp.body.id}/profile`).expect(200);
    expect(after.body.reputation.overall).toBe(100);
    expect(after.body.reputation.samples).toBe(1);
    expect(after.body.reputation.byTaskType.coding).toBe(100);
    expect(after.body.recentPerformance).toHaveLength(1);
    expect(after.body.recentPerformance[0].evaluationScore).toBe(100);

    // The node skill grew from its seeded level (non-trivial coding task).
    const node = after.body.employee.skills.find(
      (s: { skillKey: string }) => s.skillKey === 'node',
    );
    expect(node.level).toBeGreaterThan(50);
  });
});
