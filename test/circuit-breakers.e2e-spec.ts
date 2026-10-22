import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { AppModule } from '../src/app.module';
import { RuntimeRegistry } from '../src/modules/runtimes/runtime-registry';
import { AgentRunsService } from '../src/modules/runtimes/agent-runs.service';
import { BudgetsService } from '../src/modules/budgets/budgets.service';
import { ExecutionWorker } from '../src/workers/execution.worker';
import { AgentRuntime, RuntimeEvent, RuntimeRunContext } from '../src/modules/runtimes/runtime.port';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Emits repeated usage to exceed a hard budget mid-run. */
class BudgetMockRuntime implements AgentRuntime {
  readonly key = 'mock-budget';
  run(): AsyncIterable<RuntimeEvent> {
    return (async function* () {
      yield { kind: 'session', sessionId: 's' } as RuntimeEvent;
      yield { kind: 'tool_use', toolName: 'Write', toolUseId: 't1', input: {} } as RuntimeEvent;
      yield { kind: 'usage', inputTokens: 1, outputTokens: 1, costUsd: 0.5 } as RuntimeEvent;
      yield { kind: 'usage', inputTokens: 1, outputTokens: 1, costUsd: 0.5 } as RuntimeEvent;
      yield { kind: 'completed', result: 'done', sessionId: 's' } as RuntimeEvent;
    })();
  }
  resume(): AsyncIterable<RuntimeEvent> {
    return this.run();
  }
}

/** Stalls longer than the max duration to trigger the timeout breaker. */
class TimeoutMockRuntime implements AgentRuntime {
  readonly key = 'mock-timeout';
  run(_ctx: RuntimeRunContext): AsyncIterable<RuntimeEvent> {
    return (async function* () {
      yield { kind: 'session', sessionId: 's' } as RuntimeEvent;
      await sleep(500);
      yield { kind: 'completed', result: 'done' } as RuntimeEvent;
    })();
  }
  resume(): AsyncIterable<RuntimeEvent> {
    return this.run({} as RuntimeRunContext);
  }
}

describe('Circuit breakers (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    const registry = app.get(RuntimeRegistry);
    registry.register(new BudgetMockRuntime());
    registry.register(new TimeoutMockRuntime());
  });

  afterAll(async () => {
    await app.close();
  });

  async function scaffold(runtimeKey: string, settings: Record<string, unknown> = {}) {
    const server = app.getHttpServer();
    const company = await request(server).post('/companies').send({ name: 'CB Co' }).expect(201);
    const emp = await request(server)
      .post(`/companies/${company.body.id}/employees`)
      .send({
        name: 'Worker',
        role: 'Engineer',
        runtimeConfig: { runtimeKey, modelPolicy: { default: 'm' }, settings },
      })
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
      .send({ title: 'W' })
      .expect(201);
    await request(server)
      .post(`/work-items/${work.body.id}/assign`)
      .send({ employeeId: emp.body.id })
      .expect(201);
    return { companyId: company.body.id, employeeId: emp.body.id, workId: work.body.id };
  }

  it('kills a run when the hard budget is exceeded mid-run', async () => {
    const { employeeId, workId } = await scaffold('mock-budget');
    await request(app.getHttpServer())
      .put(`/employees/${employeeId}/budget`)
      .send({ hardLimitUsd: 0.9, softLimitUsd: 0.8 })
      .expect(200);

    const summary = await app.get(ExecutionWorker).runOnce();
    expect(summary?.status).toBe('killed_budget');

    const runs = await app.get(AgentRunsService).findByWorkItem(workId);
    expect(runs[0].status).toBe('killed_budget');
    const wi = await request(app.getHttpServer()).get(`/work-items/${workId}`).expect(200);
    expect(wi.body.status).toBe('failed');
  });

  it('kills a run that exceeds the max duration', async () => {
    const { workId } = await scaffold('mock-timeout', { maxDurationMs: 100 });
    const summary = await app.get(ExecutionWorker).runOnce();
    expect(summary?.status).toBe('killed_timeout');

    const runs = await app.get(AgentRunsService).findByWorkItem(workId);
    expect(runs[0].status).toBe('killed_timeout');
    // A time-limit stop is retried automatically (continuing from its branch), within the attempt budget.
    const wi = await request(app.getHttpServer()).get(`/work-items/${workId}`).expect(200);
    expect(wi.body.status).toBe('assigned');
    await request(app.getHttpServer()).post(`/work-items/${workId}/status`).send({ status: 'cancelled' }).expect(201);
  });

  it('blocks a new run when the budget is already exceeded', async () => {
    const { employeeId, workId } = await scaffold('mock-budget');
    await request(app.getHttpServer())
      .put(`/employees/${employeeId}/budget`)
      .send({ softLimitUsd: 0.5, hardLimitUsd: 1 })
      .expect(200);
    // Pre-spend beyond the soft limit.
    await app.get(BudgetsService).recordCost(null, employeeId, { costUsd: 0.6 });

    const summary = await app.get(ExecutionWorker).runOnce();
    expect(summary?.status).toBe('blocked');
    expect(summary?.agentRunId).toBe('');

    // No agent run was created, and the item stays assigned (blocked, not consumed).
    const runs = await app.get(AgentRunsService).findByWorkItem(workId);
    expect(runs).toHaveLength(0);

    // Clean up so later specs' worker.runOnce() doesn't re-pick this blocked item.
    await request(app.getHttpServer())
      .post(`/work-items/${workId}/status`)
      .send({ status: 'cancelled' })
      .expect(201);
  });
});
