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
});
