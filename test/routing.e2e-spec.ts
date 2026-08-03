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
import { AgentRuntime, RuntimeEvent, RuntimeRunContext } from '../src/modules/runtimes/runtime.port';

class RouteMockRuntime implements AgentRuntime {
  readonly key = 'mock-router';
  run(ctx: RuntimeRunContext): AsyncIterable<RuntimeEvent> {
    return (async function* () {
      yield { kind: 'session', sessionId: 's' } as RuntimeEvent;
      await writeFile(path.join(ctx.cwd, 'index.js'), '// ok\n', 'utf8');
      yield { kind: 'completed', result: 'done', sessionId: 's' } as RuntimeEvent;
    })();
  }
  resume(): AsyncIterable<RuntimeEvent> {
    return this.run({} as RuntimeRunContext);
  }
}

describe('Routers (e2e)', () => {
  let app: INestApplication;
  let companyId: string;
  let devId: string;
  let projectId: string;

  const policy = {
    default: 'claude-sonnet-4-6',
    byTaskType: { coding: 'claude-sonnet-4-6', architecture: 'claude-opus-4-8' },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    app.get(RuntimeRegistry).register(new RouteMockRuntime());

    const server = app.getHttpServer();
    const company = await request(server).post('/companies').send({ name: 'Route Co' }).expect(201);
    companyId = company.body.id;

    const dev = await request(server)
      .post(`/companies/${companyId}/employees`)
      .send({
        name: 'Grace',
        role: 'Backend Engineer',
        runtimeConfig: { runtimeKey: 'mock-router', modelPolicy: policy },
        skills: [{ skillKey: 'node', level: 90 }, { skillKey: 'sql', level: 80 }],
      })
      .expect(201);
    devId = dev.body.id;

    // A weaker-fit candidate for coding work.
    await request(server)
      .post(`/companies/${companyId}/employees`)
      .send({
        name: 'Dana',
        role: 'Designer',
        runtimeConfig: { runtimeKey: 'mock-router', modelPolicy: policy },
        skills: [{ skillKey: 'figma', level: 95 }],
      })
      .expect(201);

    const goal = await request(server)
      .post(`/companies/${companyId}/goals`)
      .send({ title: 'Build' })
      .expect(201);
    const project = await request(server)
      .post(`/goals/${goal.body.id}/projects`)
      .send({ name: 'Engineering' })
      .expect(201);
    projectId = project.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('Workforce Router assigns the best-fit employee (WHO)', async () => {
    const server = app.getHttpServer();
    const work = await request(server)
      .post(`/projects/${projectId}/work-items`)
      .send({ title: 'Implement API', taskType: 'coding' })
      .expect(201);

    const decision = await request(server).post(`/work-items/${work.body.id}/route`).expect(201);
    expect(decision.body.employeeId).toBe(devId);

    const wi = await request(server).get(`/work-items/${work.body.id}`).expect(200);
    expect(wi.body.status).toBe('assigned');
    expect(wi.body.assignedEmployeeId).toBe(devId);

    // Cancel so this assigned-but-unexecuted item doesn't leak into another
    // spec's global runOnce() (shared DB + single-fork ordering).
    await request(server)
      .post(`/work-items/${work.body.id}/status`)
      .send({ status: 'cancelled' })
      .expect(201);
  });

  it('Omni Router selects the per-task model at execution (WHAT)', async () => {
    const server = app.getHttpServer();

    // coding task -> sonnet
    const coding = await request(server)
      .post(`/projects/${projectId}/work-items`)
      .send({ title: 'Code it', taskType: 'coding' })
      .expect(201);
    await request(server).post(`/work-items/${coding.body.id}/assign`).send({ employeeId: devId }).expect(201);
    await app.get(ExecutionWorker).runOnce();
    const codingRun = (await app.get(AgentRunsService).findByWorkItem(coding.body.id))[0];
    expect(codingRun.model).toBe('claude-sonnet-4-6');

    // architecture task -> opus (same employee, different task type)
    const arch = await request(server)
      .post(`/projects/${projectId}/work-items`)
      .send({ title: 'Design it', taskType: 'architecture' })
      .expect(201);
    await request(server).post(`/work-items/${arch.body.id}/assign`).send({ employeeId: devId }).expect(201);
    await app.get(ExecutionWorker).runOnce();
    const archRun = (await app.get(AgentRunsService).findByWorkItem(arch.body.id))[0];
    expect(archRun.model).toBe('claude-opus-4-8');
  });
});
