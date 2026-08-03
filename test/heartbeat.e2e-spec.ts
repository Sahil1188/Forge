import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { AppModule } from '../src/app.module';
import { RuntimeRegistry } from '../src/modules/runtimes/runtime-registry';
import { HeartbeatWorker } from '../src/modules/heartbeats/heartbeat.worker';
import { AgentRuntime, RuntimeEvent, RuntimeRunContext } from '../src/modules/runtimes/runtime.port';

/** A CEO that plans by writing PLAN.json with one coding work item. */
class CeoMockRuntime implements AgentRuntime {
  readonly key = 'mock-ceo';
  run(ctx: RuntimeRunContext): AsyncIterable<RuntimeEvent> {
    return (async function* () {
      yield { kind: 'session', sessionId: 'ceo-sess' } as RuntimeEvent;
      await writeFile(
        path.join(ctx.cwd, 'PLAN.json'),
        JSON.stringify({
          project: 'Website',
          workItems: [
            { title: 'Build the homepage', description: 'HTML + CSS', taskType: 'coding' },
          ],
        }),
        'utf8',
      );
      yield { kind: 'usage', inputTokens: 50, outputTokens: 20, costUsd: 0.03 } as RuntimeEvent;
      yield { kind: 'completed', result: 'planned', sessionId: 'ceo-sess' } as RuntimeEvent;
    })();
  }
  resume(): AsyncIterable<RuntimeEvent> {
    return this.run({} as RuntimeRunContext);
  }
}

describe('Heartbeat + CEO planning (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    app.get(RuntimeRegistry).register(new CeoMockRuntime());
  });

  afterAll(async () => {
    await app.close();
  });

  it('wakes the CEO on goal start, plans work, and assigns the developer', async () => {
    const server = app.getHttpServer();
    const company = await request(server).post('/companies').send({ name: 'HB Co' }).expect(201);

    // CEO plans on mock-ceo; a developer is the routing target for coding work.
    const ceo = await request(server)
      .post(`/companies/${company.body.id}/employees`)
      .send({
        name: 'Ada',
        role: 'CEO',
        department: 'Executive',
        runtimeConfig: { runtimeKey: 'mock-ceo', modelPolicy: { default: 'claude-opus-4-8' } },
        skills: [{ skillKey: 'strategy', level: 85 }],
      })
      .expect(201);
    const dev = await request(server)
      .post(`/companies/${company.body.id}/employees`)
      .send({
        name: 'Grace',
        role: 'Backend Engineer',
        managerEmployeeId: ceo.body.id,
        runtimeConfig: { runtimeKey: 'claude_code', modelPolicy: { default: 'claude-sonnet-4-6' } },
        skills: [{ skillKey: 'node', level: 90 }, { skillKey: 'sql', level: 80 }],
      })
      .expect(201);

    const goal = await request(server)
      .post(`/companies/${company.body.id}/goals`)
      .send({ title: 'Build me a website' })
      .expect(201);
    await request(server).post(`/goals/${goal.body.id}/start`).expect(201);

    // Fire the heartbeat (prod does this via the goal.started subscriber).
    const result = await app.get(HeartbeatWorker).onGoalStarted(goal.body.id);

    expect(result).not.toBeNull();
    expect(result!.workItems.length).toBeGreaterThanOrEqual(1);

    // The work item was created and routed to the developer, not the CEO.
    const workItemId = result!.workItems[0].workItemId;
    expect(result!.workItems[0].assignedTo).toBe(dev.body.id);

    const wi = await request(server).get(`/work-items/${workItemId}`).expect(200);
    expect(wi.body.status).toBe('assigned');
    expect(wi.body.assignedEmployeeId).toBe(dev.body.id);
    expect(wi.body.taskType).toBe('coding');

    // Execute + clean up so this assigned item doesn't leak into other specs.
    await request(server)
      .post(`/work-items/${workItemId}/status`)
      .send({ status: 'cancelled' })
      .expect(201);
  });
});
