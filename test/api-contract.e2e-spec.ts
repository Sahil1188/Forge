import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { goals } from '../src/modules/goals/goals.schema';
import {
  assign,
  bootApp,
  createCompany,
  createEmployee,
  createProject,
  createWorkItem,
  db,
  getWorkItem,
} from './helpers';

describe('HTTP API contract — validation, 404s, and org hierarchy', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;

  beforeAll(async () => {
    app = await bootApp();
    server = app.getHttpServer();
  });
  afterAll(async () => {
    await app.close();
  });

  describe('companies', () => {
    it('health is up and reports the database', async () => {
      const res = await request(server).get('/health').expect(200);
      expect(JSON.stringify(res.body)).toMatch(/ok|up/i);
    });

    it('rejects a company without a name', async () => {
      await request(server).post('/companies').send({}).expect(400);
    });

    it('rejects a non-string name', async () => {
      await request(server).post('/companies').send({ name: 123 }).expect(400);
    });

    it('strips unknown properties instead of persisting them', async () => {
      const res = await request(server)
        .post('/companies')
        .send({ name: 'Strip Co', id: randomUUID(), evil: true })
        .expect(201);
      expect(res.body.evil).toBeUndefined();
    });

    it('returns 404 for an unknown company id', async () => {
      await request(server).get(`/companies/${randomUUID()}`).expect(404);
    });

    it('a malformed id is a client error, never a 500', async () => {
      const res = await request(server).get('/companies/not-a-uuid');
      expect(res.status).toBeLessThan(500);
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('lists the companies that were created', async () => {
      const id = await createCompany(app, 'Listed Co');
      const res = await request(server).get('/companies').expect(200);
      expect(res.body.map((c: { id: string }) => c.id)).toContain(id);
    });
  });

  describe('employees & the reporting line', () => {
    it('creates an employee with a runtime config and skills, and returns them', async () => {
      const companyId = await createCompany(app);
      const res = await request(server)
        .post(`/companies/${companyId}/employees`)
        .send({
          name: 'Grace',
          role: 'Backend Engineer',
          department: 'Eng',
          runtimeConfig: {
            runtimeKey: 'claude_code',
            modelPolicy: { default: 'claude-sonnet-4-6' },
          },
          skills: [{ skillKey: 'node', level: 90 }],
        })
        .expect(201);
      expect(res.body.runtimeConfig.runtimeKey).toBe('claude_code');
      expect(res.body.skills).toHaveLength(1);
      expect(res.body.skills[0]).toMatchObject({ skillKey: 'node', level: 90 });
    });

    it('validates required fields and ranges', async () => {
      const companyId = await createCompany(app);
      const post = (body: unknown) =>
        request(server)
          .post(`/companies/${companyId}/employees`)
          .send(body as object);
      await post({ role: 'x' }).expect(400); // no name
      await post({ name: 'x' }).expect(400); // no role
      await post({ name: 'x', role: 'y', skills: [{ skillKey: 'a', level: 101 }] }).expect(400);
      await post({ name: 'x', role: 'y', skills: [{ skillKey: 'a', level: -1 }] }).expect(400);
      await post({ name: 'x', role: 'y', skills: [{ skillKey: 'a', level: 5.5 }] }).expect(400);
      await post({ name: 'x', role: 'y', managerEmployeeId: 'not-a-uuid' }).expect(400);
      await post({ name: 'x'.repeat(201), role: 'y' }).expect(400);
    });

    it('404s when the company does not exist', async () => {
      await request(server)
        .post(`/companies/${randomUUID()}/employees`)
        .send({ name: 'a', role: 'b' })
        .expect(404);
    });

    it('records the reporting line and lists the roster', async () => {
      const companyId = await createCompany(app);
      const ceo = await createEmployee(app, companyId, { name: 'Ada', role: 'CEO' });
      const lead = await createEmployee(app, companyId, {
        name: 'Linus',
        role: 'Tech Lead',
        managerEmployeeId: ceo,
      });
      const dev = await createEmployee(app, companyId, {
        name: 'Grace',
        role: 'Engineer',
        managerEmployeeId: lead,
      });

      const roster = (await request(server).get(`/companies/${companyId}/employees`).expect(200))
        .body as Array<{
        id: string;
        managerEmployeeId: string | null;
      }>;
      const byId = Object.fromEntries(roster.map((e) => [e.id, e.managerEmployeeId]));
      expect(byId[ceo]).toBeNull();
      expect(byId[lead]).toBe(ceo);
      expect(byId[dev]).toBe(lead);
    });

    it('rooster of one company never leaks another company’s employees', async () => {
      const a = await createCompany(app, 'A');
      const b = await createCompany(app, 'B');
      const ea = await createEmployee(app, a, { name: 'ea', role: 'x' });
      const eb = await createEmployee(app, b, { name: 'eb', role: 'x' });
      const ra = (await request(server).get(`/companies/${a}/employees`).expect(200)).body.map(
        (e: { id: string }) => e.id,
      );
      expect(ra).toContain(ea);
      expect(ra).not.toContain(eb);
    });

    it('rejects a manager that does not exist with a client error (not a 500 FK violation)', async () => {
      const companyId = await createCompany(app);
      const res = await request(server)
        .post(`/companies/${companyId}/employees`)
        .send({ name: 'Orphan', role: 'x', managerEmployeeId: randomUUID() });
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('rejects a manager from a different company (the org chart cannot cross tenants)', async () => {
      const a = await createCompany(app, 'Tenant A');
      const b = await createCompany(app, 'Tenant B');
      const bossOfB = await createEmployee(app, b, { name: 'B-boss', role: 'CEO' });
      const res = await request(server)
        .post(`/companies/${a}/employees`)
        .send({ name: 'Mole', role: 'x', managerEmployeeId: bossOfB });
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('404s an unknown employee', async () => {
      await request(server).get(`/employees/${randomUUID()}`).expect(404);
    });
  });

  describe('goals, projects, work items', () => {
    it('validates goal input and 404s unknown parents', async () => {
      const companyId = await createCompany(app);
      await request(server).post(`/companies/${companyId}/goals`).send({}).expect(400);
      await request(server)
        .post(`/companies/${randomUUID()}/goals`)
        .send({ title: 'x' })
        .expect(404);
      await request(server).post(`/goals/${randomUUID()}/projects`).send({ name: 'x' }).expect(404);
      await request(server)
        .post(`/projects/${randomUUID()}/work-items`)
        .send({ title: 'x' })
        .expect(404);
    });

    it('a started goal becomes active; completed/cancelled goals cannot be restarted', async () => {
      const companyId = await createCompany(app);
      const goal = await request(server)
        .post(`/companies/${companyId}/goals`)
        .send({ title: 'G' })
        .expect(201);
      expect(goal.body.status).toBe('draft');
      const started = await request(server).post(`/goals/${goal.body.id}/start`).expect(201);
      expect(started.body.status).toBe('active');

      await db(app).update(goals).set({ status: 'cancelled' }).where(eq(goals.id, goal.body.id));
      await request(server).post(`/goals/${goal.body.id}/start`).expect(400);
      await db(app).update(goals).set({ status: 'completed' }).where(eq(goals.id, goal.body.id));
      await request(server).post(`/goals/${goal.body.id}/start`).expect(400);
    });

    it('validates work-item fields', async () => {
      const { projectId } = await createProject(app, await createCompany(app));
      const post = (body: unknown) =>
        request(server)
          .post(`/projects/${projectId}/work-items`)
          .send(body as object);
      await post({}).expect(400);
      await post({ title: 'x'.repeat(301) }).expect(400);
      await post({ title: 'x', taskType: 'sorcery' }).expect(400);
      await post({ title: 'x', priority: 101 }).expect(400);
      await post({ title: 'x', priority: -1 }).expect(400);
      await post({ title: 'x', priority: 1.5 }).expect(400);
      const ok = await post({ title: 'x', taskType: 'qa', priority: 7 }).expect(201);
      expect(ok.body).toMatchObject({ status: 'created', taskType: 'qa', priority: 7 });
    });

    it('defaults a work item to generic/priority 0 and carries the company id from the project', async () => {
      const companyId = await createCompany(app);
      const { projectId } = await createProject(app, companyId);
      const id = await createWorkItem(app, projectId, { title: 'defaults' });
      const wi = await getWorkItem(app, id);
      expect(wi).toMatchObject({ status: 'created' });
      const raw = (await request(server).get(`/work-items/${id}`).expect(200)).body;
      expect(raw.taskType).toBe('generic');
      expect(raw.priority).toBe(0);
      expect(raw.companyId).toBe(companyId);
    });

    it('lists a project’s work items', async () => {
      const { projectId } = await createProject(app, await createCompany(app));
      const a = await createWorkItem(app, projectId, { title: 'a' });
      const b = await createWorkItem(app, projectId, { title: 'b' });
      const res = await request(server).get(`/projects/${projectId}/work-items`).expect(200);
      expect(res.body.map((w: { id: string }) => w.id).sort()).toEqual([a, b].sort());
    });
  });

  describe('assignment & status transitions', () => {
    it('assigning moves created → assigned and records the assignee', async () => {
      const companyId = await createCompany(app);
      const emp = await createEmployee(app, companyId, { name: 'e', role: 'Engineer' });
      const { projectId } = await createProject(app, companyId);
      const wi = await createWorkItem(app, projectId);
      await assign(app, wi, emp);
      const item = await getWorkItem(app, wi);
      expect(item.status).toBe('assigned');
      expect(item.assignedEmployeeId).toBe(emp);
      await request(server)
        .post(`/work-items/${wi}/status`)
        .send({ status: 'cancelled' })
        .expect(201); // keep the queue clean
    });

    it('rejects assigning to an unknown employee, an invalid uuid, or an unknown work item', async () => {
      const companyId = await createCompany(app);
      const { projectId } = await createProject(app, companyId);
      const wi = await createWorkItem(app, projectId);
      await request(server)
        .post(`/work-items/${wi}/assign`)
        .send({ employeeId: randomUUID() })
        .expect(404);
      await request(server)
        .post(`/work-items/${wi}/assign`)
        .send({ employeeId: 'nope' })
        .expect(400);
      await request(server)
        .post(`/work-items/${randomUUID()}/assign`)
        .send({ employeeId: randomUUID() })
        .expect(404);
    });

    it('does not let a company’s work be assigned to another company’s employee (tenant isolation)', async () => {
      const a = await createCompany(app, 'Owner');
      const b = await createCompany(app, 'Other');
      const outsider = await createEmployee(app, b, { name: 'outsider', role: 'Engineer' });
      const { projectId } = await createProject(app, a);
      const wi = await createWorkItem(app, projectId);
      const res = await request(server)
        .post(`/work-items/${wi}/assign`)
        .send({ employeeId: outsider });
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
      expect((await getWorkItem(app, wi)).status).toBe('created');
    });

    it('rejects illegal status transitions with a 400 that names the edge', async () => {
      const { projectId } = await createProject(app, await createCompany(app));
      const wi = await createWorkItem(app, projectId);
      const res = await request(server)
        .post(`/work-items/${wi}/status`)
        .send({ status: 'done' })
        .expect(400);
      expect(JSON.stringify(res.body)).toContain('created -> done');
      expect((await getWorkItem(app, wi)).status).toBe('created');
    });

    it('rejects an unknown status value', async () => {
      const { projectId } = await createProject(app, await createCompany(app));
      const wi = await createWorkItem(app, projectId);
      await request(server)
        .post(`/work-items/${wi}/status`)
        .send({ status: 'teleported' })
        .expect(400);
    });

    it('cancelled is terminal over HTTP too', async () => {
      const { projectId } = await createProject(app, await createCompany(app));
      const wi = await createWorkItem(app, projectId);
      await request(server)
        .post(`/work-items/${wi}/status`)
        .send({ status: 'cancelled' })
        .expect(201);
      await request(server)
        .post(`/work-items/${wi}/status`)
        .send({ status: 'assigned' })
        .expect(400);
    });

    it('a done item cannot be re-assigned', async () => {
      const companyId = await createCompany(app);
      const emp = await createEmployee(app, companyId, { name: 'e', role: 'Engineer' });
      const { projectId } = await createProject(app, companyId);
      const wi = await createWorkItem(app, projectId);
      // Walk the legal path to done.
      for (const status of ['assigned', 'in_progress', 'evaluating', 'done']) {
        await request(server).post(`/work-items/${wi}/status`).send({ status }).expect(201);
      }
      await request(server).post(`/work-items/${wi}/assign`).send({ employeeId: emp }).expect(400);
    });
  });

  describe('dependencies', () => {
    async function twoItems() {
      const { projectId } = await createProject(app, await createCompany(app));
      return [
        await createWorkItem(app, projectId, { title: 'A' }),
        await createWorkItem(app, projectId, { title: 'B' }),
      ];
    }

    it('records a dependency and exposes it on the work item', async () => {
      const [a, b] = await twoItems();
      await request(server)
        .post(`/work-items/${b}/dependencies`)
        .send({ dependsOnWorkItemId: a })
        .expect(201);
      const wi = (await request(server).get(`/work-items/${b}`).expect(200)).body;
      expect(
        wi.dependencies.map((d: { dependsOnWorkItemId: string }) => d.dependsOnWorkItemId),
      ).toEqual([a]);
    });

    it('is idempotent for the same edge', async () => {
      const [a, b] = await twoItems();
      await request(server)
        .post(`/work-items/${b}/dependencies`)
        .send({ dependsOnWorkItemId: a })
        .expect(201);
      await request(server)
        .post(`/work-items/${b}/dependencies`)
        .send({ dependsOnWorkItemId: a })
        .expect(201);
      const wi = (await request(server).get(`/work-items/${b}`).expect(200)).body;
      expect(wi.dependencies).toHaveLength(1);
    });

    it('rejects self-dependency, unknown targets, and bad uuids', async () => {
      const [a] = await twoItems();
      await request(server)
        .post(`/work-items/${a}/dependencies`)
        .send({ dependsOnWorkItemId: a })
        .expect(400);
      await request(server)
        .post(`/work-items/${a}/dependencies`)
        .send({ dependsOnWorkItemId: randomUUID() })
        .expect(404);
      await request(server)
        .post(`/work-items/${a}/dependencies`)
        .send({ dependsOnWorkItemId: 'x' })
        .expect(400);
    });

    it('rejects a dependency cycle (A→B→A would deadlock the graph)', async () => {
      const [a, b] = await twoItems();
      await request(server)
        .post(`/work-items/${b}/dependencies`)
        .send({ dependsOnWorkItemId: a })
        .expect(201);
      const res = await request(server)
        .post(`/work-items/${a}/dependencies`)
        .send({ dependsOnWorkItemId: b });
      expect(res.status).toBe(400);
    });

    it('rejects a longer cycle (A→B→C→A)', async () => {
      const { projectId } = await createProject(app, await createCompany(app));
      const [a, b, c] = [
        await createWorkItem(app, projectId, { title: 'A' }),
        await createWorkItem(app, projectId, { title: 'B' }),
        await createWorkItem(app, projectId, { title: 'C' }),
      ];
      await request(server)
        .post(`/work-items/${a}/dependencies`)
        .send({ dependsOnWorkItemId: b })
        .expect(201);
      await request(server)
        .post(`/work-items/${b}/dependencies`)
        .send({ dependsOnWorkItemId: c })
        .expect(201);
      await request(server)
        .post(`/work-items/${c}/dependencies`)
        .send({ dependsOnWorkItemId: a })
        .expect(400);
    });
  });

  describe('budgets, approvals, memory endpoints', () => {
    it('sets and reads a budget, and validates it', async () => {
      const companyId = await createCompany(app);
      const emp = await createEmployee(app, companyId, { name: 'e', role: 'x' });
      await request(server)
        .put(`/employees/${emp}/budget`)
        .send({ softLimitUsd: 1, hardLimitUsd: 2, period: 'day' })
        .expect(200);
      // GET reports the live evaluation against the stored limits.
      const got = await request(server).get(`/employees/${emp}/budget`).expect(200);
      expect(got.body).toMatchObject({ state: 'ok', spend: 0, softLimit: 1, hardLimit: 2 });
      await request(server)
        .put(`/employees/${randomUUID()}/budget`)
        .send({ hardLimitUsd: 1 })
        .expect(404);
      await request(server).put(`/employees/${emp}/budget`).send({ softLimitUsd: -1 }).expect(400);
      await request(server).put(`/employees/${emp}/budget`).send({ period: 'century' }).expect(400);
    });

    it('rejects a budget whose soft limit exceeds the hard limit (the soft alarm could never fire first)', async () => {
      const emp = await createEmployee(app, await createCompany(app), { name: 'e', role: 'x' });
      const res = await request(server)
        .put(`/employees/${emp}/budget`)
        .send({ softLimitUsd: 5, hardLimitUsd: 1 });
      expect(res.status).toBe(400);
    });

    it('404s unknown approvals and validates decisions', async () => {
      await request(server).get(`/approvals/${randomUUID()}`).expect(404);
      await request(server)
        .post(`/approvals/${randomUUID()}/decision`)
        .send({ decision: 'approved' })
        .expect(404);
      await request(server)
        .post(`/approvals/${randomUUID()}/decision`)
        .send({ decision: 'maybe' })
        .expect(400);
    });

    it('a new employee has no memories and an empty profile', async () => {
      const emp = await createEmployee(app, await createCompany(app), { name: 'fresh', role: 'x' });
      expect((await request(server).get(`/employees/${emp}/memories`).expect(200)).body).toEqual(
        [],
      );
      const profile = (await request(server).get(`/employees/${emp}/profile`).expect(200)).body;
      expect(profile.reputation.overall).toBeNull();
      expect(profile.recentPerformance).toEqual([]);
    });
  });

  describe('observability', () => {
    it('company overview lists employees and 404s for unknown companies', async () => {
      const companyId = await createCompany(app);
      await createEmployee(app, companyId, { name: 'o1', role: 'x' });
      const res = await request(server).get(`/companies/${companyId}/overview`).expect(200);
      expect(res.body.employees).toHaveLength(1);
      const missing = await request(server).get(`/companies/${randomUUID()}/overview`);
      expect(missing.status).toBe(404);
    });

    it('unknown agent run and work-item runs behave sensibly', async () => {
      await request(server).get(`/agent-runs/${randomUUID()}`).expect(404);
      const { projectId } = await createProject(app, await createCompany(app));
      const wi = await createWorkItem(app, projectId);
      expect((await request(server).get(`/work-items/${wi}/runs`).expect(200)).body).toEqual([]);
    });

    it('serves the dashboard', async () => {
      const res = await request(server).get('/ui').expect(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
    });
  });
});
