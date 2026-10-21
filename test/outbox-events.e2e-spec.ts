import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { events } from '../src/infrastructure/events/events.schema';
import { EventTypes } from '../src/infrastructure/events/event-types';
import { EventBus, DomainEvent } from '../src/infrastructure/events/event-bus';
import { OutboxDispatcher } from '../src/infrastructure/events/outbox.dispatcher';
import { RuntimeRegistry } from '../src/modules/runtimes/runtime-registry';
import { BudgetsService } from '../src/modules/budgets/budgets.service';
import { ExecutionWorker } from '../src/workers/execution.worker';
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
  events as streamOf,
  setGovernance,
} from './helpers';

describe('Transactional outbox & domain events (e2e)', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;

  beforeAll(async () => {
    app = await bootApp();
    server = app.getHttpServer();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(async () => {
    await cancelStrayWork(app);
  });

  const forAggregate = (aggregateId: string) =>
    db(app).select().from(events).where(eq(events.aggregateId, aggregateId)).orderBy(asc(events.createdAt));

  async function drain(): Promise<DomainEvent[]> {
    const got: DomainEvent[] = [];
    const off = app.get(EventBus).subscribe('*', (e) => void got.push(e));
    const dispatcher = app.get(OutboxDispatcher);
    for (let i = 0; i < 50; i += 1) if ((await dispatcher.tick()) === 0) break;
    off();
    return got;
  }

  it('records an event for each domain write, in the same order the writes happened', async () => {
    const companyId = await createCompany(app);
    const goal = (await request(server).post(`/companies/${companyId}/goals`).send({ title: 'G' }).expect(201)).body.id;
    await request(server).post(`/goals/${goal}/start`).expect(201);
    expect((await forAggregate(goal)).map((e) => e.type)).toEqual([EventTypes.GoalCreated, EventTypes.GoalStarted]);

    const emp = await createEmployee(app, companyId, { name: 'e', role: 'Engineer' });
    const project = (await request(server).post(`/goals/${goal}/projects`).send({ name: 'P' }).expect(201)).body.id;
    const wi = await createWorkItem(app, project);
    await assign(app, wi, emp);
    await request(server).post(`/work-items/${wi}/status`).send({ status: 'cancelled' }).expect(201);

    expect((await forAggregate(wi)).map((e) => e.type)).toEqual([
      EventTypes.WorkCreated,
      EventTypes.WorkAssigned,
      EventTypes.WorkStatusChanged,
    ]);
    const statusEvent = (await forAggregate(wi)).at(-1)!;
    expect(statusEvent.payload).toMatchObject({ from: 'assigned', to: 'cancelled' });
  });

  it('a rejected write leaves no event behind (events are committed atomically with the change)', async () => {
    const { projectId } = await createProject(app, await createCompany(app));
    const wi = await createWorkItem(app, projectId);
    const before = (await forAggregate(wi)).length;
    await request(server).post(`/work-items/${wi}/status`).send({ status: 'done' }).expect(400); // illegal
    expect((await forAggregate(wi)).length).toBe(before);
  });

  it('delivers every pending event exactly once and stamps it published', async () => {
    const companyId = await createCompany(app);
    const goal = (await request(server).post(`/companies/${companyId}/goals`).send({ title: 'once' }).expect(201)).body.id;
    const first = await drain();
    expect(first.filter((e) => e.aggregateId === goal).map((e) => e.type)).toEqual([EventTypes.GoalCreated]);

    // Nothing left unpublished for that aggregate, and a second pass redelivers nothing.
    const unpublished = await db(app)
      .select()
      .from(events)
      .where(and(eq(events.aggregateId, goal), isNull(events.publishedAt)));
    expect(unpublished).toEqual([]);
    expect((await drain()).filter((e) => e.aggregateId === goal)).toEqual([]);
  });

  it('delivers events to subscribers in creation order with an ISO timestamp', async () => {
    const companyId = await createCompany(app);
    const goal = (await request(server).post(`/companies/${companyId}/goals`).send({ title: 'ordered' }).expect(201)).body.id;
    await request(server).post(`/goals/${goal}/start`).expect(201);
    const mine = (await drain()).filter((e) => e.aggregateId === goal);
    expect(mine.map((e) => e.type)).toEqual([EventTypes.GoalCreated, EventTypes.GoalStarted]);
    for (const e of mine) expect(new Date(e.occurredAt).toISOString()).toBe(e.occurredAt);
  });

  it('a failing subscriber never blocks delivery to the others, and the event is still marked published', async () => {
    const bus = app.get(EventBus);
    const seen: string[] = [];
    const offBad = bus.subscribe(EventTypes.GoalCreated, () => {
      throw new Error('subscriber bug');
    });
    const offGood = bus.subscribe(EventTypes.GoalCreated, (e) => void seen.push(e.aggregateId));
    const companyId = await createCompany(app);
    const goal = (await request(server).post(`/companies/${companyId}/goals`).send({ title: 'resilient' }).expect(201)).body.id;
    await drain();
    offBad();
    offGood();
    expect(seen).toContain(goal);
    const rows = await forAggregate(goal);
    expect(rows[0].publishedAt).not.toBeNull();
  });

  it('a budget block emits budget.exceeded for the employee', async () => {
    const key = `outbox-${Math.random().toString(36).slice(2, 8)}`;
    app.get(RuntimeRegistry).register(new ScriptedRuntime(key, () => streamOf(completes())));
    const companyId = await createCompany(app);
    const emp = await createEmployee(app, companyId, { name: 'e', role: 'Engineer', runtimeKey: key });
    const { projectId } = await createProject(app, companyId);
    const wi = await createWorkItem(app, projectId);
    await assign(app, wi, emp);
    await request(server).put(`/employees/${emp}/budget`).send({ softLimitUsd: 0.1, hardLimitUsd: 0.2 }).expect(200);
    await app.get(BudgetsService).recordCost(null, emp, { costUsd: 0.15 });

    expect((await app.get(ExecutionWorker).runOnce())?.status).toBe('blocked');
    const rows = await forAggregate(emp);
    const blocked = rows.find((r) => r.type === EventTypes.BudgetExceeded);
    expect(blocked?.payload).toMatchObject({ state: 'soft_exceeded' });
    expect((blocked?.payload as { spend: number }).spend).toBeCloseTo(0.15, 10);
    await request(server).post(`/work-items/${wi}/status`).send({ status: 'cancelled' }).expect(201);
  });

  it('approval requests and decisions are all announced', async () => {
    const key = `outbox-appr-${Math.random().toString(36).slice(2, 8)}`;
    app.get(RuntimeRegistry).register(
      new ScriptedRuntime(key, async function* (ctx) {
        yield { kind: 'session', sessionId: 's' } as const;
        const d = await ctx.canUseTool!('Deploy', {});
        if (d.behavior === 'pause') {
          yield { kind: 'needs_approval', toolName: 'Deploy', input: {}, approvalRef: d.approvalId } as const;
          return;
        }
        yield { kind: 'completed', result: 'ok' } as const;
      }),
    );
    const companyId = await createCompany(app);
    const emp = await createEmployee(app, companyId, { name: 'e', role: 'Engineer', runtimeKey: key });
    await setGovernance(app, emp, { approvalRequiredTools: ['Deploy'] });
    const { projectId } = await createProject(app, companyId);
    const wi = await createWorkItem(app, projectId);
    await assign(app, wi, emp);

    const paused = await app.get(ExecutionWorker).runOnce();
    const approvalId = paused!.approvalId!;
    await request(server).post(`/approvals/${approvalId}/decision`).send({ decision: 'approved' }).expect(201);
    await request(server).post(`/approvals/${approvalId}/decision`).send({ decision: 'approved' }); // repeat: no new event
    expect((await forAggregate(approvalId)).map((e) => e.type)).toEqual([
      EventTypes.ApprovalRequested,
      EventTypes.ApprovalApproved,
    ]);
    await request(server).post(`/work-items/${wi}/status`).send({ status: 'cancelled' }).expect(201);
  });
});
