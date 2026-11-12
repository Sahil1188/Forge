import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { AppModule } from '../src/app.module';
import { ProviderRegistry } from '../src/modules/runtimes/custom/provider-registry';
import { AgentRunsService } from '../src/modules/runtimes/agent-runs.service';
import { ApprovalsService } from '../src/modules/approvals/approvals.service';
import { ExecutionWorker } from '../src/workers/execution.worker';
import {
  ChatRequest,
  ChatResponse,
  ModelProvider,
} from '../src/modules/runtimes/custom/model-provider';
import { DRIZZLE, Database } from '../src/infrastructure/database/drizzle.provider';
import { employees } from '../src/modules/employees/employees.schema';
import { eq } from 'drizzle-orm';

/** Scripted provider: writes two files then ends the turn. */
class ScriptedProvider implements ModelProvider {
  readonly name = 'scripted';
  async chat(req: ChatRequest): Promise<ChatResponse> {
    const usedTool = req.messages.some((m) => m.role === 'tool');
    if (!usedTool) {
      return {
        text: 'scaffolding',
        toolCalls: [
          {
            id: 'c1',
            name: 'write_file',
            input: { path: 'lib.js', content: 'module.exports.ok=()=>true;\n' },
          },
          {
            id: 'c2',
            name: 'write_file',
            input: { path: 'index.js', content: 'require("./lib");\n' },
          },
        ],
        stopReason: 'tool_use',
        usage: { inputTokens: 30, outputTokens: 15, costUsd: 0.02 },
      };
    }
    return {
      text: 'done',
      toolCalls: [],
      stopReason: 'end_turn',
      usage: { inputTokens: 5, outputTokens: 3, costUsd: 0.004 },
    };
  }
}

/** Emits a single gated tool call, so one approval suffices for pause/resume. */
class SingleWriteProvider implements ModelProvider {
  readonly name = 'scripted-single';
  async chat(req: ChatRequest): Promise<ChatResponse> {
    const usedTool = req.messages.some((m) => m.role === 'tool');
    if (!usedTool) {
      return {
        text: 'writing',
        toolCalls: [{ id: 'c1', name: 'write_file', input: { path: 'lib.js', content: 'ok\n' } }],
        stopReason: 'tool_use',
        usage: { inputTokens: 10, outputTokens: 5, costUsd: 0.01 },
      };
    }
    return {
      text: 'done',
      toolCalls: [],
      stopReason: 'end_turn',
      usage: { inputTokens: 4, outputTokens: 2, costUsd: 0.003 },
    };
  }
}

describe('CustomRuntime pipeline (e2e)', () => {
  let app: INestApplication;
  let db: Database;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    const registry = app.get(ProviderRegistry);
    registry.register(new ScriptedProvider());
    registry.register(new SingleWriteProvider());
    db = app.get<Database>(DRIZZLE);
  });

  afterAll(async () => {
    await app.close();
  });

  async function makeCustomWorker(
    companyId: string,
    governance: Record<string, unknown> = {},
    provider = 'scripted',
  ) {
    const emp = await request(app.getHttpServer())
      .post(`/companies/${companyId}/employees`)
      .send({
        name: 'Qwen Worker',
        role: 'Backend Engineer',
        runtimeConfig: {
          runtimeKey: 'custom',
          provider,
          modelPolicy: { byTaskType: { coding: 'code-model' }, default: 'cheap-model' },
        },
        skills: [{ skillKey: 'node', level: 85 }],
      })
      .expect(201);
    if (Object.keys(governance).length) {
      await db.update(employees).set({ governance }).where(eq(employees.id, emp.body.id));
    }
    return emp.body.id;
  }

  async function assignedWorkItem(companyId: string, employeeId: string): Promise<string> {
    const server = app.getHttpServer();
    const goal = await request(server)
      .post(`/companies/${companyId}/goals`)
      .send({ title: 'G' })
      .expect(201);
    const project = await request(server)
      .post(`/goals/${goal.body.id}/projects`)
      .send({ name: 'P' })
      .expect(201);
    const work = await request(server)
      .post(`/projects/${project.body.id}/work-items`)
      .send({ title: 'Scaffold module', taskType: 'coding' })
      .expect(201);
    await request(server)
      .post(`/work-items/${work.body.id}/assign`)
      .send({ employeeId })
      .expect(201);
    return work.body.id;
  }

  it('executes a work item via CustomRuntime with Omni-Router-selected provider+model', async () => {
    const server = app.getHttpServer();
    const company = await request(server)
      .post('/companies')
      .send({ name: 'Custom Co' })
      .expect(201);
    const workerId = await makeCustomWorker(company.body.id);
    const workId = await assignedWorkItem(company.body.id, workerId);

    const summary = await app.get(ExecutionWorker).runOnce();
    expect(summary?.status).toBe('completed');
    expect(summary?.runtimeKey).toBe('custom');
    expect(summary?.model).toBe('code-model'); // Omni Router byTaskType.coding
    expect(summary?.filesChanged).toEqual(expect.arrayContaining(['lib.js', 'index.js']));

    const run = (await app.get(AgentRunsService).findByWorkItem(workId))[0];
    expect(run.runtimeKey).toBe('custom');
    expect(run.provider).toBe('scripted');
    expect(run.estimatedCostUsd).toBeGreaterThan(0);
  });

  it('applies the same governance pause/resume through CustomRuntime', async () => {
    const server = app.getHttpServer();
    const company = await request(server)
      .post('/companies')
      .send({ name: 'Custom Gov Co' })
      .expect(201);
    // Gate the write_file tool behind human approval (single gated call).
    const workerId = await makeCustomWorker(
      company.body.id,
      { approvalRequiredTools: ['write_file'] },
      'scripted-single',
    );
    const workId = await assignedWorkItem(company.body.id, workerId);

    const paused = await app.get(ExecutionWorker).runOnce();
    expect(paused?.status).toBe('paused');
    expect(paused?.approvalId).toBeTruthy();

    const run = (await app.get(AgentRunsService).findByWorkItem(workId))[0];
    expect(run.status).toBe('needs_approval');

    await request(server)
      .post(`/approvals/${paused!.approvalId}/decision`)
      .send({ decision: 'approved' })
      .expect(201);
    const resumed = await app.get(ExecutionWorker).onApprovalDecision(run.id);
    expect(resumed?.status).toBe('completed');

    const wi = await request(server).get(`/work-items/${workId}`).expect(200);
    expect(wi.body.status).toBe('evaluating');
  });
});
