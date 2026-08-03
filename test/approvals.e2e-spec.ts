import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { writeFile, readFile } from 'node:fs/promises';
import * as path from 'node:path';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { AppModule } from '../src/app.module';
import { RuntimeRegistry } from '../src/modules/runtimes/runtime-registry';
import { AgentRunsService } from '../src/modules/runtimes/agent-runs.service';
import { ExecutionWorker } from '../src/workers/execution.worker';
import { AgentRuntime, RuntimeEvent, RuntimeRunContext } from '../src/modules/runtimes/runtime.port';

const SECRET = 'ghp_0123456789abcdef0123456789abcdef0123';

/** Attempts a governed `Deploy` tool; pauses if gated, deploys once allowed. */
class ApprovalMockRuntime implements AgentRuntime {
  readonly key = 'mock-approval';
  run(ctx: RuntimeRunContext): AsyncIterable<RuntimeEvent> {
    return this.gen(ctx);
  }
  resume(_sessionId: string, ctx: RuntimeRunContext): AsyncIterable<RuntimeEvent> {
    return this.gen(ctx);
  }
  private async *gen(ctx: RuntimeRunContext): AsyncIterable<RuntimeEvent> {
    yield { kind: 'session', sessionId: 'appr-sess' };
    const decision = ctx.canUseTool
      ? await ctx.canUseTool('Deploy', { cmd: 'deploy prod' })
      : ({ behavior: 'allow' } as const);

    if (decision.behavior === 'pause') {
      yield {
        kind: 'needs_approval',
        toolName: 'Deploy',
        input: { cmd: 'deploy prod' },
        approvalRef: decision.approvalId,
      };
      return;
    }
    if (decision.behavior === 'deny') {
      yield { kind: 'failed', error: 'denied' };
      return;
    }
    await writeFile(path.join(ctx.cwd, 'deployed.txt'), 'ok\n', 'utf8');
    yield { kind: 'tool_use', toolName: 'Deploy', toolUseId: 'd1', input: {} };
    yield { kind: 'assistant_text', text: `Deployed with token ${SECRET}` };
    yield { kind: 'usage', inputTokens: 10, outputTokens: 5, costUsd: 0.001 };
    yield { kind: 'completed', result: 'done', sessionId: 'appr-sess' };
  }
}

describe('Approval flow (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    app.get(RuntimeRegistry).register(new ApprovalMockRuntime());
  });

  afterAll(async () => {
    await app.close();
  });

  async function makeAssignedWorkItem(companyId: string, employeeId: string): Promise<string> {
    const server = app.getHttpServer();
    const goal = await request(server)
      .post(`/companies/${companyId}/goals`)
      .send({ title: 'Ship it' })
      .expect(201);
    const project = await request(server)
      .post(`/goals/${goal.body.id}/projects`)
      .send({ name: 'Ops' })
      .expect(201);
    const work = await request(server)
      .post(`/projects/${project.body.id}/work-items`)
      .send({ title: 'Deploy service', taskType: 'devops' })
      .expect(201);
    await request(server)
      .post(`/work-items/${work.body.id}/assign`)
      .send({ employeeId })
      .expect(201);
    return work.body.id;
  }

  it('pauses on an approval-required tool, then resumes and completes on approve', async () => {
    const server = app.getHttpServer();
    const company = await request(server).post('/companies').send({ name: 'Appr Co' }).expect(201);

    // Employee with a governance policy that gates the Deploy tool.
    const emp = await request(server)
      .post(`/companies/${company.body.id}/employees`)
      .send({
        name: 'Dev',
        role: 'DevOps',
        runtimeConfig: { runtimeKey: 'mock-approval', modelPolicy: { default: 'mock-model' } },
      })
      .expect(201);
    await setGovernance(app, emp.body.id, { approvalRequiredTools: ['Deploy'] });

    const workId = await makeAssignedWorkItem(company.body.id, emp.body.id);

    const worker = app.get(ExecutionWorker);
    const paused = await worker.runOnce();
    expect(paused?.status).toBe('paused');
    expect(paused?.approvalId).toBeTruthy();

    // Run + work item are parked awaiting approval.
    const runs = await app.get(AgentRunsService).findByWorkItem(workId);
    expect(runs[0].status).toBe('needs_approval');
    const wi = await request(server).get(`/work-items/${workId}`).expect(200);
    expect(wi.body.status).toBe('needs_approval');

    const approvalView = await request(server).get(`/approvals/${paused!.approvalId}`).expect(200);
    expect(approvalView.body.status).toBe('pending');

    // Human approves -> resume.
    await request(server)
      .post(`/approvals/${paused!.approvalId}/decision`)
      .send({ decision: 'approved' })
      .expect(201);
    const resumed = await worker.onApprovalDecision(runs[0].id);
    expect(resumed?.status).toBe('completed');

    const wiDone = await request(server).get(`/work-items/${workId}`).expect(200);
    expect(wiDone.body.status).toBe('evaluating');

    // The stored transcript is redacted.
    const finalRun = await app.get(AgentRunsService).findOne(runs[0].id);
    expect(finalRun.transcriptRef).toBeTruthy();
    const transcript = await readFile(finalRun.transcriptRef as string, 'utf8');
    expect(transcript).not.toContain(SECRET);
    expect(transcript).toContain('***REDACTED***');
  });

  it('halts when the approval is denied', async () => {
    const server = app.getHttpServer();
    const company = await request(server).post('/companies').send({ name: 'Deny Co' }).expect(201);
    const emp = await request(server)
      .post(`/companies/${company.body.id}/employees`)
      .send({
        name: 'Dev2',
        role: 'DevOps',
        runtimeConfig: { runtimeKey: 'mock-approval', modelPolicy: { default: 'mock-model' } },
      })
      .expect(201);
    await setGovernance(app, emp.body.id, { approvalRequiredTools: ['Deploy'] });

    const workId = await makeAssignedWorkItem(company.body.id, emp.body.id);
    const worker = app.get(ExecutionWorker);
    const paused = await worker.runOnce();
    expect(paused?.status).toBe('paused');

    await request(server)
      .post(`/approvals/${paused!.approvalId}/decision`)
      .send({ decision: 'denied' })
      .expect(201);
    const runs = await app.get(AgentRunsService).findByWorkItem(workId);
    const halted = await worker.onApprovalDecision(runs[0].id);
    expect(halted?.status).toBe('failed');

    const wi = await request(server).get(`/work-items/${workId}`).expect(200);
    expect(wi.body.status).toBe('failed');
  });
});

/** Sets an employee's governance json directly via the DB (no API surface yet). */
async function setGovernance(
  app: INestApplication,
  employeeId: string,
  governance: Record<string, unknown>,
): Promise<void> {
  const { DRIZZLE } = await import('../src/infrastructure/database/drizzle.provider');
  const { employees } = await import('../src/modules/employees/employees.schema');
  const { eq } = await import('drizzle-orm');
  const db = app.get<import('../src/infrastructure/database/drizzle.provider').Database>(DRIZZLE);
  await db.update(employees).set({ governance }).where(eq(employees.id, employeeId));
}
