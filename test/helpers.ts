import { Test } from '@nestjs/testing';
import { securityMiddleware, securityOptionsFromEnv } from '../src/infrastructure/security/http-security';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { eq, inArray } from 'drizzle-orm';
import { AppModule } from '../src/app.module';
import { DRIZZLE, Database } from '../src/infrastructure/database/drizzle.provider';
import { employees } from '../src/modules/employees/employees.schema';
import { workItems } from '../src/modules/work/work.schema';
import { AgentRuntime, RuntimeEvent, RuntimeRunContext } from '../src/modules/runtimes/runtime.port';

/** Boots the real AppModule exactly as production wires it (same validation pipe). */
export async function bootApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  // Same request hardening as production (main.ts), so every e2e test runs through it.
  // (write limit lifted: suites legitimately make hundreds of changes a minute)
  app.use(securityMiddleware(securityOptionsFromEnv({ FORGE_WRITE_LIMIT_PER_MINUTE: '1000000' } as NodeJS.ProcessEnv)));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  // The execution queue is global and shared across specs: start from a clean slate so
  // another spec's leftovers can never be picked up by this spec's worker.
  await cancelStrayWork(app);
  return app;
}

export function db(app: INestApplication): Database {
  return app.get<Database>(DRIZZLE);
}

/** Cancels anything still sitting in a runnable state (assigned) from earlier specs. */
export async function cancelStrayWork(app: INestApplication): Promise<void> {
  await db(app).update(workItems).set({ status: 'cancelled' }).where(inArray(workItems.status, ['assigned']));
}

export async function setGovernance(
  app: INestApplication,
  employeeId: string,
  governance: Record<string, unknown>,
): Promise<void> {
  await db(app).update(employees).set({ governance }).where(eq(employees.id, employeeId));
}

export interface EmployeeSpec {
  name: string;
  role: string;
  department?: string;
  managerEmployeeId?: string;
  runtimeKey?: string;
  provider?: string;
  modelPolicy?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  skills?: Array<{ skillKey: string; level: number }>;
}

export async function createCompany(app: INestApplication, name = 'Test Co'): Promise<string> {
  const res = await request(app.getHttpServer()).post('/companies').send({ name }).expect(201);
  return res.body.id;
}

export async function createEmployee(
  app: INestApplication,
  companyId: string,
  spec: EmployeeSpec,
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post(`/companies/${companyId}/employees`)
    .send({
      name: spec.name,
      role: spec.role,
      department: spec.department,
      managerEmployeeId: spec.managerEmployeeId,
      runtimeConfig: {
        runtimeKey: spec.runtimeKey ?? 'mock',
        provider: spec.provider,
        modelPolicy: spec.modelPolicy ?? { default: 'mock-model' },
        settings: spec.settings ?? {},
      },
      skills: spec.skills,
    })
    .expect(201);
  return res.body.id;
}

export interface Scaffold {
  companyId: string;
  goalId: string;
  projectId: string;
}

export async function createProject(app: INestApplication, companyId: string): Promise<Scaffold> {
  const server = app.getHttpServer();
  const goal = await request(server).post(`/companies/${companyId}/goals`).send({ title: 'Goal' }).expect(201);
  const project = await request(server).post(`/goals/${goal.body.id}/projects`).send({ name: 'Project' }).expect(201);
  return { companyId, goalId: goal.body.id, projectId: project.body.id };
}

export async function createWorkItem(
  app: INestApplication,
  projectId: string,
  body: { title?: string; taskType?: string; priority?: number; description?: string } = {},
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post(`/projects/${projectId}/work-items`)
    .send({ title: 'Work', ...body })
    .expect(201);
  return res.body.id;
}

export async function assign(app: INestApplication, workItemId: string, employeeId: string): Promise<void> {
  await request(app.getHttpServer()).post(`/work-items/${workItemId}/assign`).send({ employeeId }).expect(201);
}

export async function getWorkItem(app: INestApplication, id: string) {
  const res = await request(app.getHttpServer()).get(`/work-items/${id}`).expect(200);
  return res.body as { id: string; status: string; artifacts?: Record<string, unknown>; assignedEmployeeId?: string };
}

/** A fully scripted runtime: the script decides exactly which events each run emits. */
export class ScriptedRuntime implements AgentRuntime {
  readonly contexts: RuntimeRunContext[] = [];
  runs = 0;
  resumes = 0;
  constructor(
    readonly key: string,
    private readonly script: (ctx: RuntimeRunContext, runNumber: number) => AsyncIterable<RuntimeEvent>,
  ) {}
  run(ctx: RuntimeRunContext): AsyncIterable<RuntimeEvent> {
    this.contexts.push(ctx);
    this.runs += 1;
    return this.script(ctx, this.runs);
  }
  resume(_sessionId: string, ctx: RuntimeRunContext): AsyncIterable<RuntimeEvent> {
    this.contexts.push(ctx);
    this.resumes += 1;
    return this.script(ctx, this.runs + this.resumes);
  }
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const completes = (sessionId = 's', cost = 0.001): RuntimeEvent[] => [
  { kind: 'session', sessionId },
  { kind: 'usage', inputTokens: 10, outputTokens: 5, costUsd: cost },
  { kind: 'completed', result: 'ok', sessionId },
];

export async function* events(list: RuntimeEvent[]): AsyncIterable<RuntimeEvent> {
  for (const e of list) yield e;
}
