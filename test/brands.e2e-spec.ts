import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { cpSync, mkdtempSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { RuntimeRegistry } from '../src/modules/runtimes/runtime-registry';
import { RuntimeEvent, RuntimeRunContext } from '../src/modules/runtimes/runtime.port';
import { CeoPlanner } from '../src/modules/heartbeats/ceo-planner.service';
import { WORKSPACE_PORT, WorkspacePort } from '../src/modules/workspaces/workspace.port';
import { projectBrandName } from '../src/workers/execution.worker';
import { brandRules } from '../src/modules/evaluation/visual/visual-gate';
import {
  ScriptedRuntime,
  bootApp,
  cancelStrayWork,
  createCompany,
  createEmployee,
} from './helpers';

describe('Brand systems: every UI follows one of the brands (e2e)', () => {
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

  /** A company with a CEO whose PLAN.json the test controls, plus the prompt it was given. */
  async function plannedCompany(plan: unknown) {
    const key = `brand-ceo-${randomUUID().slice(0, 8)}`;
    const prompts: string[] = [];
    app.get(RuntimeRegistry).register(
      new ScriptedRuntime(key, async function* (ctx: RuntimeRunContext) {
        prompts.push(ctx.task);
        await writeFile(path.join(ctx.cwd, 'PLAN.json'), JSON.stringify(plan));
        yield { kind: 'completed', result: 'planned', sessionId: 's' } as RuntimeEvent;
      }),
    );
    const companyId = await createCompany(app, `Brand Co ${key}`);
    const ceo = await createEmployee(app, companyId, { name: 'Ada', role: 'CEO', runtimeKey: key });
    await createEmployee(app, companyId, {
      name: 'Mira',
      role: 'Frontend Engineer',
      managerEmployeeId: ceo,
      runtimeKey: key,
      skills: [{ skillKey: 'react', level: 90 }],
    });
    return { companyId, prompts };
  }

  const goal = async (companyId: string, body: Record<string, unknown>) =>
    (await request(server).post(`/companies/${companyId}/goals`).send(body).expect(201)).body as {
      id: string;
    };
  const brandFile = (slug: string) =>
    readFile(path.join(process.cwd(), 'brands', `${slug}.md`), 'utf8');
  const projectFile = async (projectId: string, file: string) =>
    readFile(
      path.join(await app.get<WorkspacePort>(WORKSPACE_PORT).projectPath(projectId), file),
      'utf8',
    ).catch(() => null);

  it('lists the brand library and describes each brand with its checklists', async () => {
    const list = (await request(server).get('/brands').expect(200)).body as Array<{
      slug: string;
      name: string;
    }>;
    expect(list.length).toBeGreaterThanOrEqual(10);
    expect(list.map((b) => b.slug)).toEqual(
      expect.arrayContaining(['studio-signal', 'porcelain', 'ivory-press', 'glasshouse']),
    );
    const one = (await request(server).get('/brands/studio-signal').expect(200)).body;
    expect(one).toMatchObject({ name: 'Studio Signal' });
    expect(one.platformChecklist.length).toBeGreaterThan(3);
    expect(one.websiteChecklist.length).toBeGreaterThan(3);
    await request(server).get('/brands/no-such-brand').expect(404);
  });

  it('a company can set a default brand; unknown brands are refused for companies and goals', async () => {
    const companyId = await createCompany(app, 'Brand Default Co');
    await request(server).patch(`/companies/${companyId}`).send({ brand: 'made-up' }).expect(400);
    const res = await request(server)
      .patch(`/companies/${companyId}`)
      .send({ brand: 'ivory-press' })
      .expect(200);
    expect(res.body.brand).toBe('ivory-press');
    await request(server).patch(`/companies/${companyId}`).send({ brand: '' }).expect(200);
    await request(server)
      .post(`/companies/${companyId}/goals`)
      .send({ title: 'x', brand: 'made-up' })
      .expect(400);
  });

  it('a UI goal gets the brand the planner chose, committed into the project as BRAND.md', async () => {
    const { companyId, prompts } = await plannedCompany({
      project: 'Clinic booking',
      brand: 'porcelain',
      workItems: [
        { title: 'Booking web app', taskType: 'frontend', description: 'Screens for patients' },
      ],
    });
    const g = await goal(companyId, { title: 'Clinic booking portal' });
    const plan = await app.get(CeoPlanner).plan(g.id);
    // The planner was offered the library to choose from.
    expect(prompts[0]).toContain('studio-signal: Studio Signal');
    expect(prompts[0]).toContain('Usefulness first');
    expect(await projectFile(plan.projectId, 'BRAND.md')).toBe(await brandFile('porcelain'));
    expect((await request(server).get(`/goals/${g.id}`).expect(200)).body.brand).toBe('porcelain');
  });

  it("the user's choice beats the company default, which beats the planner's pick", async () => {
    const { companyId, prompts } = await plannedCompany({
      project: 'Desk',
      brand: 'porcelain',
      workItems: [{ title: 'Dashboard', taskType: 'frontend' }],
    });
    await request(server)
      .patch(`/companies/${companyId}`)
      .send({ brand: 'ivory-press' })
      .expect(200);
    const viaCompany = await goal(companyId, { title: 'Reporting dashboard' });
    const p1 = await app.get(CeoPlanner).plan(viaCompany.id);
    expect(prompts[0]).toContain('Ivory Press brand');
    expect(await projectFile(p1.projectId, 'BRAND.md')).toBe(await brandFile('ivory-press'));

    const viaGoal = await goal(companyId, { title: 'Ops dashboard', brand: 'field-instrument' });
    const p2 = await app.get(CeoPlanner).plan(viaGoal.id);
    expect(await projectFile(p2.projectId, 'BRAND.md')).toBe(await brandFile('field-instrument'));
  });

  it('without a planner pick, a UI goal gets the brand that fits the product', async () => {
    const { companyId } = await plannedCompany({
      project: 'Deals',
      workItems: [{ title: 'Deal pipeline web app', taskType: 'frontend' }],
    });
    const g = await goal(companyId, { title: 'M&A deal pipeline for an investment bank' });
    const plan = await app.get(CeoPlanner).plan(g.id);
    expect(await projectFile(plan.projectId, 'BRAND.md')).toBe(await brandFile('studio-signal'));
  });

  it('work without a user interface gets no brand', async () => {
    const { companyId } = await plannedCompany({
      project: 'Parser',
      workItems: [{ title: 'CSV parser library', taskType: 'coding' }],
    });
    const g = await goal(companyId, { title: 'A CSV parser library' });
    const plan = await app.get(CeoPlanner).plan(g.id);
    expect(await projectFile(plan.projectId, 'BRAND.md')).toBeNull();
    expect((await request(server).get(`/goals/${g.id}`).expect(200)).body.brand).toBeNull();
  });

  it('agents and the design review read the brand from the project', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'branded-'));
    expect(projectBrandName(dir)).toBeNull();
    expect(await brandRules(dir)).toEqual([]);
    await writeFile(path.join(dir, 'BRAND.md'), await brandFile('graph-paper'));
    expect(projectBrandName(dir)).toBe('Graph Paper');
    const rules = (await brandRules(dir)).join('\n');
    expect(rules).toContain('Graph Paper brand');
    expect(rules).toContain('Nothing animates');
  });

  it('an admin can add a brand from the console; invalid files are refused', async () => {
    const saved = process.env.FORGE_BRANDS_DIR;
    const dir = mkdtempSync(path.join(tmpdir(), 'brand-lib-'));
    cpSync(path.join(process.cwd(), 'brands'), dir, { recursive: true });
    process.env.FORGE_BRANDS_DIR = dir;
    try {
      const content = (await brandFile('porcelain')).replace('**Porcelain**', '**Ocean Desk**');
      const res = await request(server)
        .post('/brands')
        .send({ slug: 'ocean-desk', content })
        .expect(201);
      expect(res.body.name).toBe('Ocean Desk');
      expect(
        ((await request(server).get('/brands').expect(200)).body as Array<{ slug: string }>).map(
          (b) => b.slug,
        ),
      ).toContain('ocean-desk');
      await request(server)
        .post('/brands')
        .send({ slug: 'broken', content: 'x'.repeat(300) })
        .expect(400);
      await request(server).post('/brands').send({ slug: 'Bad Id', content }).expect(400);
    } finally {
      if (saved === undefined) delete process.env.FORGE_BRANDS_DIR;
      else process.env.FORGE_BRANDS_DIR = saved;
    }
  });
});
