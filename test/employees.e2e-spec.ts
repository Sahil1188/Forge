import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { AppModule } from '../src/app.module';

describe('Organization & workforce (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a company and two employees with the model policy persisted', async () => {
    const server = app.getHttpServer();

    const companyRes = await request(server)
      .post('/companies')
      .send({ name: 'Test Co', description: 'e2e' })
      .expect(201);
    const companyId = companyRes.body.id as string;
    expect(companyId).toBeTruthy();

    const ceoRes = await request(server)
      .post(`/companies/${companyId}/employees`)
      .send({
        name: 'Ada',
        role: 'CEO',
        runtimeConfig: {
          runtimeKey: 'claude_code',
          modelPolicy: { default: 'claude-opus-4-8' },
        },
        skills: [{ skillKey: 'strategy', level: 80 }],
      })
      .expect(201);
    expect(ceoRes.body.runtimeConfig.modelPolicy.default).toBe('claude-opus-4-8');
    expect(ceoRes.body.runtimeConfig.runtimeKey).toBe('claude_code');
    expect(ceoRes.body.skills).toHaveLength(1);

    const devRes = await request(server)
      .post(`/companies/${companyId}/employees`)
      .send({
        name: 'Grace',
        role: 'Backend Engineer',
        managerEmployeeId: ceoRes.body.id,
        runtimeConfig: { modelPolicy: { default: 'claude-sonnet-4-6' } },
      })
      .expect(201);
    expect(devRes.body.managerEmployeeId).toBe(ceoRes.body.id);
    expect(devRes.body.runtimeConfig.modelPolicy.default).toBe('claude-sonnet-4-6');

    // Re-fetch to confirm persistence round-trips.
    const fetched = await request(server).get(`/employees/${devRes.body.id}`).expect(200);
    expect(fetched.body.runtimeConfig.modelPolicy.default).toBe('claude-sonnet-4-6');

    const list = await request(server).get(`/companies/${companyId}/employees`).expect(200);
    expect(list.body).toHaveLength(2);
  });

  it('rejects an employee for an unknown company with 404', async () => {
    await request(app.getHttpServer())
      .post('/companies/00000000-0000-0000-0000-000000000000/employees')
      .send({ name: 'Ghost', role: 'Nobody' })
      .expect(404);
  });

  describe('editable briefs', () => {
    const brief = {
      mission: 'Keep the payments API correct and fast.',
      standards: ['Money is integer pence.', '  ', 'Every endpoint has a test.'],
      workflow: ['Read the code first.', 'Make the smallest change.'],
      definitionOfDone: ['Tests pass.'],
      never: ['Never log card numbers.'],
      escalateWhen: [],
      deliverable: 'A merged, tested change.',
    };

    it('reads the built-in brief, saves an edited one, and resets it', async () => {
      const server = app.getHttpServer();
      const companyId = (
        await request(server).post('/companies').send({ name: 'Brief Co' }).expect(201)
      ).body.id;
      const id = (
        await request(server)
          .post(`/companies/${companyId}/employees`)
          .send({ name: 'Grace', role: 'Senior Backend Engineer' })
          .expect(201)
      ).body.id;

      const initial = (await request(server).get(`/employees/${id}/brief`).expect(200)).body;
      expect(initial.custom).toBe(false);
      expect(initial.brief.mission).toBe(initial.builtIn.mission);

      const saved = (await request(server).put(`/employees/${id}/brief`).send(brief).expect(200))
        .body;
      expect(saved.custom).toBe(true);
      expect(saved.brief.mission).toBe(brief.mission);
      expect(saved.brief.standards).toEqual([
        'Money is integer pence.',
        'Every endpoint has a test.',
      ]); // blank lines dropped
      expect(saved.brief.name).toBe('Grace');

      const reset = (await request(server).delete(`/employees/${id}/brief`).expect(200)).body;
      expect(reset.custom).toBe(false);
      expect(reset.brief.mission).toBe(initial.builtIn.mission);
    });

    it('rejects an incomplete brief with a clear message', async () => {
      const server = app.getHttpServer();
      const companyId = (
        await request(server).post('/companies').send({ name: 'Brief Co 2' }).expect(201)
      ).body.id;
      const id = (
        await request(server)
          .post(`/companies/${companyId}/employees`)
          .send({ name: 'Noor', role: 'Designer' })
          .expect(201)
      ).body.id;
      const res = await request(server)
        .put(`/employees/${id}/brief`)
        .send({ ...brief, mission: '', standards: [] })
        .expect(400);
      expect(JSON.stringify(res.body.message)).toMatch(/mission/);
      expect(JSON.stringify(res.body.message)).toMatch(/standards/);
    });
  });
});
