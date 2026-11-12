import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { bootApp, createCompany, db } from './helpers';
import { users } from '../src/modules/companies/companies.schema';

/**
 * Accounts and roles end to end. The tests run in order: local mode → owner setup → people with
 * different roles → what each may do. Accounts are cleared before every spec file (setup file).
 */
describe('Accounts and roles (e2e)', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;
  let acme: string;
  let other: string;
  const cookies: Record<string, string> = {};

  const login = async (email: string, password: string) => {
    const res = await request(server).post('/auth/login').send({ email, password }).expect(200);
    return String(res.headers['set-cookie']).split(';')[0];
  };

  beforeAll(async () => {
    app = await bootApp();
    server = app.getHttpServer();
    acme = await createCompany(app, 'Acme Access');
  });
  afterAll(async () => {
    await app.close();
  });

  it('with no accounts, Forge is a local single-operator app: everything works without signing in', async () => {
    expect((await request(server).get('/auth/status').expect(200)).body).toMatchObject({
      accounts: false,
      user: null,
    });
    await request(server).get(`/companies/${acme}/dashboard`).expect(200);
  });

  it('setting up the first account turns login on; that person owns every existing company', async () => {
    await request(server)
      .post('/auth/setup')
      .send({ email: 'owner@acme.test', name: 'Olivia', password: 'short' })
      .expect(400);
    const res = await request(server)
      .post('/auth/setup')
      .send({ email: 'Owner@Acme.test', name: 'Olivia', password: 'correct horse battery' })
      .expect(201);
    cookies.owner = String(res.headers['set-cookie']).split(';')[0];
    expect(String(res.headers['set-cookie'])).toMatch(/HttpOnly; SameSite=Strict/);
    await request(server)
      .post('/auth/setup')
      .send({ email: 'x@acme.test', name: 'X', password: 'correct horse battery' })
      .expect(409);

    await request(server).get(`/companies/${acme}/dashboard`).expect(401);
    const status = (
      await request(server).get('/auth/status').set('Cookie', cookies.owner).expect(200)
    ).body;
    expect(status).toMatchObject({ accounts: true, user: { email: 'owner@acme.test' } });
    expect(status.companies).toEqual(expect.arrayContaining([{ companyId: acme, role: 'owner' }]));
  });

  it('wrong passwords are refused; passwords are stored hashed', async () => {
    await request(server)
      .post('/auth/login')
      .send({ email: 'owner@acme.test', password: 'wrong password!!' })
      .expect(401);
    const [stored] = await db(app)
      .select({ hash: users.passwordHash })
      .from(users)
      .where(eq(users.email, 'owner@acme.test'));
    expect(stored.hash).not.toContain('correct horse');
    expect(stored.hash).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/);
  });

  it('owners add people with a role; only owners can see or manage people', async () => {
    for (const [email, role] of [
      ['vic@acme.test', 'viewer'],
      ['meg@acme.test', 'member'],
      ['ada@acme.test', 'admin'],
    ]) {
      await request(server)
        .post(`/companies/${acme}/members`)
        .set('Cookie', cookies.owner)
        .send({ email, name: email, password: 'a long enough pw', role })
        .expect(201);
      cookies[role] = await login(email, 'a long enough pw');
    }
    const members = (
      await request(server)
        .get(`/companies/${acme}/members`)
        .set('Cookie', cookies.owner)
        .expect(200)
    ).body;
    expect(members.map((m: { role: string }) => m.role).sort()).toEqual([
      'admin',
      'member',
      'owner',
      'viewer',
    ]);
    await request(server)
      .get(`/companies/${acme}/members`)
      .set('Cookie', cookies.admin)
      .expect(403);
  });

  it('viewers read; members give work; admins manage the team; each is refused above their role', async () => {
    await request(server)
      .get(`/companies/${acme}/dashboard`)
      .set('Cookie', cookies.viewer)
      .expect(200);
    const refused = await request(server)
      .post(`/companies/${acme}/goals`)
      .set('Cookie', cookies.viewer)
      .send({ title: 'No' })
      .expect(403);
    expect(refused.body.message).toMatch(/member role; you are a viewer/);

    const goal = (
      await request(server)
        .post(`/companies/${acme}/goals`)
        .set('Cookie', cookies.member)
        .send({ title: 'Yes' })
        .expect(201)
    ).body;
    await request(server).get(`/goals/${goal.id}/board`).set('Cookie', cookies.viewer).expect(200);
    await request(server)
      .post(`/companies/${acme}/employees`)
      .set('Cookie', cookies.member)
      .send({ name: 'E', role: 'Engineer' })
      .expect(403);
    await request(server)
      .post(`/companies/${acme}/employees`)
      .set('Cookie', cookies.admin)
      .send({
        name: 'E',
        role: 'Engineer',
        runtimeConfig: { runtimeKey: 'claude_code', modelPolicy: { default: 'sonnet' } },
      })
      .expect(201);
    await request(server)
      .patch(`/companies/${acme}`)
      .set('Cookie', cookies.member)
      .send({ name: 'Renamed' })
      .expect(403);
  });

  it('people only see and touch their own companies', async () => {
    other = (
      await request(server)
        .post('/companies')
        .set('Cookie', cookies.member)
        .send({ name: 'Meg Co' })
        .expect(201)
    ).body.id;
    const megSees = (
      await request(server).get('/companies').set('Cookie', cookies.member).expect(200)
    ).body.map((c: { id: string }) => c.id);
    expect(megSees).toEqual(expect.arrayContaining([acme, other]));
    const vicSees = (
      await request(server).get('/companies').set('Cookie', cookies.viewer).expect(200)
    ).body.map((c: { id: string }) => c.id);
    expect(vicSees).toContain(acme);
    expect(vicSees).not.toContain(other);
    await request(server)
      .get(`/companies/${other}/dashboard`)
      .set('Cookie', cookies.viewer)
      .expect(403);
  });

  it('a company always keeps an owner; signing out ends the session', async () => {
    const me = (await request(server).get('/auth/status').set('Cookie', cookies.owner)).body.user
      .id;
    await request(server)
      .patch(`/companies/${acme}/members/${me}`)
      .set('Cookie', cookies.owner)
      .send({ role: 'admin' })
      .expect(400);
    await request(server).post('/auth/logout').set('Cookie', cookies.viewer).expect(200);
    await request(server)
      .get(`/companies/${acme}/dashboard`)
      .set('Cookie', cookies.viewer)
      .expect(401);
  });

  it('automation with the service token has full access', async () => {
    process.env.FORGE_API_TOKEN = 'service-token-for-tests-0123456789';
    try {
      await request(server)
        .get(`/companies/${acme}/dashboard`)
        .set('Authorization', `Bearer ${process.env.FORGE_API_TOKEN}`)
        .expect(200);
      await request(server)
        .get(`/companies/${acme}/dashboard`)
        .set('Authorization', 'Bearer wrong')
        .expect(401);
    } finally {
      delete process.env.FORGE_API_TOKEN;
    }
  });
});
