import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { AppModule } from '../src/app.module';
import { EventBus, DomainEvent } from '../src/infrastructure/events/event-bus';
import { OutboxDispatcher } from '../src/infrastructure/events/outbox.dispatcher';
import { EventTypes } from '../src/infrastructure/events/event-types';

describe('Work graph & event outbox (e2e)', () => {
  let app: INestApplication;
  let bus: EventBus;
  let dispatcher: OutboxDispatcher;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    bus = app.get(EventBus);
    dispatcher = app.get(OutboxDispatcher);
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a goal->project->work graph and delivers outbox events to subscribers', async () => {
    const server = app.getHttpServer();
    const received: DomainEvent[] = [];
    bus.subscribe('*', (e) => {
      received.push(e);
    });

    const company = await request(server).post('/companies').send({ name: 'Graph Co' }).expect(201);
    const companyId = company.body.id;

    const goal = await request(server)
      .post(`/companies/${companyId}/goals`)
      .send({ title: 'Build me a website' })
      .expect(201);
    expect(goal.body.status).toBe('draft');

    const started = await request(server).post(`/goals/${goal.body.id}/start`).expect(201);
    expect(started.body.status).toBe('active');

    const project = await request(server)
      .post(`/goals/${goal.body.id}/projects`)
      .send({ name: 'Engineering' })
      .expect(201);

    const work = await request(server)
      .post(`/projects/${project.body.id}/work-items`)
      .send({ title: 'Scaffold Express app', taskType: 'coding' })
      .expect(201);
    expect(work.body.status).toBe('created');

    // Drain the shared outbox fully (other specs may have left a backlog that
    // exceeds a single tick's batch limit), then assert delivery.
    for (let i = 0; i < 20; i += 1) {
      if ((await dispatcher.tick()) === 0) break;
    }

    const types = received.map((e) => e.type);
    expect(types).toContain(EventTypes.GoalCreated);
    expect(types).toContain(EventTypes.GoalStarted);
    expect(types).toContain(EventTypes.ProjectCreated);
    expect(types).toContain(EventTypes.WorkCreated);

    // The outbox is shared across specs; assert *our* goal's event was delivered.
    const goalCreated = received.find(
      (e) => e.type === EventTypes.GoalCreated && e.aggregateId === goal.body.id,
    );
    expect(goalCreated).toBeDefined();
  });

  it('enforces the work-item status machine over HTTP', async () => {
    const server = app.getHttpServer();
    const company = await request(server).post('/companies').send({ name: 'SM Co' }).expect(201);
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

    // created -> done is illegal (must go through assigned/in_progress/evaluating).
    await request(server)
      .post(`/work-items/${work.body.id}/status`)
      .send({ status: 'done' })
      .expect(400);

    // Assign a real employee, then walk the valid path.
    const emp = await request(server)
      .post(`/companies/${company.body.id}/employees`)
      .send({ name: 'Dev', role: 'Engineer' })
      .expect(201);
    await request(server)
      .post(`/work-items/${work.body.id}/assign`)
      .send({ employeeId: emp.body.id })
      .expect(201);
    await request(server)
      .post(`/work-items/${work.body.id}/status`)
      .send({ status: 'in_progress' })
      .expect(201);
    const evaluating = await request(server)
      .post(`/work-items/${work.body.id}/status`)
      .send({ status: 'evaluating' })
      .expect(201);
    expect(evaluating.body.status).toBe('evaluating');
  });
});
