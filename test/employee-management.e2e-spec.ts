import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RuntimeRegistry } from '../src/modules/runtimes/runtime-registry';
import { ExecutionWorker } from '../src/workers/execution.worker';
import { RuntimeEvent } from '../src/modules/runtimes/runtime.port';
import {
  ScriptedRuntime,
  assign,
  bootApp,
  createCompany,
  createEmployee,
  createProject,
  createWorkItem,
} from './helpers';

describe('Employee management API (e2e)', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;

  beforeAll(async () => {
    app = await bootApp();
    server = app.getHttpServer();
  });
  afterAll(async () => {
    await app.close();
  });

  const patch = (id: string, body: object) => request(server).patch(`/employees/${id}`).send(body);

  describe('create with governance', () => {
    it('stores the governance policy given at creation', async () => {
      const companyId = await createCompany(app);
      const res = await request(server)
        .post(`/companies/${companyId}/employees`)
        .send({
          name: 'Gov',
          role: 'Engineer',
          governance: { deniedTools: ['Bash'], approvalRequiredTools: ['Write'] },
        })
        .expect(201);
      expect(res.body.governance).toEqual({
        deniedTools: ['Bash'],
        approvalRequiredTools: ['Write'],
      });
    });

    it('rejects malformed governance and duplicate skills (without creating a half-made employee)', async () => {
      const companyId = await createCompany(app);
      const post = (body: object) =>
        request(server).post(`/companies/${companyId}/employees`).send(body);
      await post({ name: 'x', role: 'y', governance: { deniedTools: 'Bash' } }).expect(400);
      await post({ name: 'x', role: 'y', governance: { deniedTools: [42] } }).expect(400);
      await post({
        name: 'dup',
        role: 'y',
        skills: [
          { skillKey: 'node', level: 1 },
          { skillKey: 'Node', level: 2 },
        ],
      }).expect(400);
      const roster = (await request(server).get(`/companies/${companyId}/employees`).expect(200))
        .body;
      expect(roster).toEqual([]);
    });
  });

  describe('PATCH /employees/:id', () => {
    it('updates profile fields and leaves the rest untouched', async () => {
      const companyId = await createCompany(app);
      const id = await createEmployee(app, companyId, {
        name: 'Old',
        role: 'Engineer',
        department: 'Eng',
      });
      const res = await patch(id, { name: 'New', description: 'writes code' }).expect(200);
      expect(res.body).toMatchObject({
        name: 'New',
        role: 'Engineer',
        department: 'Eng',
        description: 'writes code',
      });
    });

    it('updates the model policy and limits in place, keeping unspecified runtime fields', async () => {
      const companyId = await createCompany(app);
      const id = await createEmployee(app, companyId, {
        name: 'R',
        role: 'Engineer',
        runtimeKey: 'claude_code',
        modelPolicy: { default: 'a' },
      });
      const res = await patch(id, {
        runtimeConfig: { modelPolicy: { default: 'claude-haiku-4-5' }, settings: { maxTurns: 9 } },
      }).expect(200);
      expect(res.body.runtimeConfig).toMatchObject({
        runtimeKey: 'claude_code',
        modelPolicy: { default: 'claude-haiku-4-5' },
        settings: { maxTurns: 9 },
      });
    });

    it('creates a runtime config for an employee that had none', async () => {
      const companyId = await createCompany(app);
      const bare = (
        await request(server)
          .post(`/companies/${companyId}/employees`)
          .send({ name: 'Bare', role: 'x' })
          .expect(201)
      ).body;
      expect(bare.runtimeConfig).toBeNull();
      const res = await patch(bare.id, {
        runtimeConfig: { runtimeKey: 'custom', provider: 'ollama' },
      }).expect(200);
      expect(res.body.runtimeConfig).toMatchObject({ runtimeKey: 'custom', provider: 'ollama' });
    });

    it('replaces the governance policy, and the worker enforces the new policy on the next run', async () => {
      const key = `gov-${randomUUID().slice(0, 6)}`;
      const decisions: string[] = [];
      app.get(RuntimeRegistry).register(
        new ScriptedRuntime(key, async function* (ctx) {
          yield { kind: 'session', sessionId: 's' } as RuntimeEvent;
          decisions.push((await ctx.canUseTool!('Bash', { command: 'ls' })).behavior);
          yield { kind: 'completed', result: 'ok', sessionId: 's' } as RuntimeEvent;
        }),
      );
      const companyId = await createCompany(app);
      const id = await createEmployee(app, companyId, {
        name: 'G',
        role: 'Engineer',
        runtimeKey: key,
      });
      const res = await patch(id, { governance: { deniedTools: ['Bash'] } }).expect(200);
      expect(res.body.governance).toEqual({ deniedTools: ['Bash'] });

      const { projectId } = await createProject(app, companyId);
      const wi = await createWorkItem(app, projectId);
      await assign(app, wi, id);
      await app.get(ExecutionWorker).runOnce();
      expect(decisions).toEqual(['deny']);
    });

    it('moves an employee to a new manager, or clears the reporting line with null', async () => {
      const companyId = await createCompany(app);
      const ceo = await createEmployee(app, companyId, { name: 'Ceo', role: 'CEO' });
      const lead = await createEmployee(app, companyId, { name: 'Lead', role: 'Lead' });
      const dev = await createEmployee(app, companyId, {
        name: 'Dev',
        role: 'Engineer',
        managerEmployeeId: ceo,
      });
      expect(
        (await patch(dev, { managerEmployeeId: lead }).expect(200)).body.managerEmployeeId,
      ).toBe(lead);
      expect(
        (await patch(dev, { managerEmployeeId: null }).expect(200)).body.managerEmployeeId,
      ).toBeNull();
    });

    it('refuses self-management, cycles, unknown and cross-company managers', async () => {
      const companyId = await createCompany(app);
      const top = await createEmployee(app, companyId, { name: 'Top', role: 'CEO' });
      const mid = await createEmployee(app, companyId, {
        name: 'Mid',
        role: 'Lead',
        managerEmployeeId: top,
      });
      const low = await createEmployee(app, companyId, {
        name: 'Low',
        role: 'Engineer',
        managerEmployeeId: mid,
      });
      await patch(top, { managerEmployeeId: top }).expect(400);
      await patch(top, { managerEmployeeId: low }).expect(400); // low → mid → top → low
      await patch(top, { managerEmployeeId: randomUUID() }).expect(400);
      const other = await createEmployee(app, await createCompany(app), {
        name: 'Elsewhere',
        role: 'CEO',
      });
      await patch(low, { managerEmployeeId: other }).expect(400);
      // Nothing changed.
      expect(
        (await request(server).get(`/employees/${top}`).expect(200)).body.managerEmployeeId,
      ).toBeNull();
    });

    it('validates the payload and 404s unknown employees', async () => {
      const id = await createEmployee(app, await createCompany(app), { name: 'V', role: 'x' });
      await patch(id, { name: 'x'.repeat(201) }).expect(400);
      await patch(id, { status: 'on_vacation' }).expect(400);
      await patch(id, { managerEmployeeId: 'nope' }).expect(400);
      await patch(randomUUID(), { name: 'ghost' }).expect(404);
    });
  });

  describe('PUT /employees/:id/skills', () => {
    it('replaces the skill set', async () => {
      const id = await createEmployee(app, await createCompany(app), {
        name: 'S',
        role: 'Engineer',
        skills: [{ skillKey: 'java', level: 50 }],
      });
      const res = await request(server)
        .put(`/employees/${id}/skills`)
        .send({
          skills: [
            { skillKey: 'node', level: 80 },
            { skillKey: 'sql', level: 60 },
          ],
        })
        .expect(200);
      expect(
        res.body.skills
          .map((s: { skillKey: string; level: number }) => `${s.skillKey}:${s.level}`)
          .sort(),
      ).toEqual(['node:80', 'sql:60']);
    });

    it('an empty list clears skills', async () => {
      const id = await createEmployee(app, await createCompany(app), {
        name: 'S',
        role: 'x',
        skills: [{ skillKey: 'a', level: 1 }],
      });
      expect(
        (await request(server).put(`/employees/${id}/skills`).send({ skills: [] }).expect(200)).body
          .skills,
      ).toEqual([]);
    });

    it('rejects out-of-range levels and duplicates, and leaves the old skills in place', async () => {
      const id = await createEmployee(app, await createCompany(app), {
        name: 'S',
        role: 'x',
        skills: [{ skillKey: 'keep', level: 5 }],
      });
      await request(server)
        .put(`/employees/${id}/skills`)
        .send({ skills: [{ skillKey: 'a', level: 101 }] })
        .expect(400);
      await request(server)
        .put(`/employees/${id}/skills`)
        .send({
          skills: [
            { skillKey: 'a', level: 1 },
            { skillKey: 'a', level: 2 },
          ],
        })
        .expect(400);
      await request(server).put(`/employees/${id}/skills`).send({}).expect(400);
      const skills = (await request(server).get(`/employees/${id}`).expect(200)).body.skills;
      expect(skills.map((s: { skillKey: string }) => s.skillKey)).toEqual(['keep']);
    });

    it('new skills feed straight into routing', async () => {
      const companyId = await createCompany(app);
      const a = await createEmployee(app, companyId, {
        name: 'A',
        role: 'Engineer',
        runtimeKey: 'claude_code',
        skills: [{ skillKey: 'node', level: 90 }],
      });
      const b = await createEmployee(app, companyId, {
        name: 'B',
        role: 'Engineer',
        runtimeKey: 'claude_code',
        skills: [{ skillKey: 'node', level: 10 }],
      });
      const { projectId } = await createProject(app, companyId);
      await request(server)
        .put(`/employees/${b}/skills`)
        .send({ skills: [{ skillKey: 'node', level: 99 }] })
        .expect(200);
      const wi = await createWorkItem(app, projectId, { taskType: 'coding' });
      const routed = (await request(server).post(`/work-items/${wi}/route`).expect(201)).body;
      expect(routed.employeeId).toBe(b);
      expect(routed.employeeId).not.toBe(a);
      await request(server)
        .post(`/work-items/${wi}/status`)
        .send({ status: 'cancelled' })
        .expect(201);
    });
  });

  describe('DELETE /employees/:id', () => {
    it('deactivates: gone from the roster and 404 afterwards, history kept', async () => {
      const companyId = await createCompany(app);
      const id = await createEmployee(app, companyId, { name: 'Leaver', role: 'x' });
      await request(server).delete(`/employees/${id}`).expect(204);
      await request(server).get(`/employees/${id}`).expect(404);
      const roster = (
        await request(server).get(`/companies/${companyId}/employees`).expect(200)
      ).body.map((e: { id: string }) => e.id);
      expect(roster).not.toContain(id);
      await request(server).delete(`/employees/${id}`).expect(404);
    });

    it('refuses while the employee still holds active work', async () => {
      const companyId = await createCompany(app);
      const id = await createEmployee(app, companyId, { name: 'Busy', role: 'Engineer' });
      const { projectId } = await createProject(app, companyId);
      const wi = await createWorkItem(app, projectId);
      await assign(app, wi, id);
      await request(server).delete(`/employees/${id}`).expect(409);
      await request(server)
        .post(`/work-items/${wi}/status`)
        .send({ status: 'cancelled' })
        .expect(201);
      await request(server).delete(`/employees/${id}`).expect(204);
    });

    it('refuses while the employee still manages people', async () => {
      const companyId = await createCompany(app);
      const boss = await createEmployee(app, companyId, { name: 'Boss', role: 'Lead' });
      await createEmployee(app, companyId, {
        name: 'Report',
        role: 'Engineer',
        managerEmployeeId: boss,
      });
      await request(server).delete(`/employees/${boss}`).expect(409);
    });

    it('a deactivated employee is never routed new work', async () => {
      const companyId = await createCompany(app);
      const gone = await createEmployee(app, companyId, {
        name: 'Gone',
        role: 'Engineer',
        runtimeKey: 'claude_code',
        skills: [{ skillKey: 'node', level: 99 }],
      });
      const stay = await createEmployee(app, companyId, {
        name: 'Stay',
        role: 'Engineer',
        runtimeKey: 'claude_code',
      });
      await request(server).delete(`/employees/${gone}`).expect(204);
      const { projectId } = await createProject(app, companyId);
      const wi = await createWorkItem(app, projectId, { taskType: 'coding' });
      expect(
        (await request(server).post(`/work-items/${wi}/route`).expect(201)).body.employeeId,
      ).toBe(stay);
      await request(server)
        .post(`/work-items/${wi}/status`)
        .send({ status: 'cancelled' })
        .expect(201);
    });
  });
});
