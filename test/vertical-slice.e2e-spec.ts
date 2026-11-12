import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { AppModule } from '../src/app.module';
import { RuntimeRegistry } from '../src/modules/runtimes/runtime-registry';
import { AgentRunsService } from '../src/modules/runtimes/agent-runs.service';
import { ExecutionWorker } from '../src/workers/execution.worker';
import { HeartbeatWorker } from '../src/modules/heartbeats/heartbeat.worker';
import { EvaluationWorker } from '../src/modules/evaluation/evaluation.worker';
import {
  AgentRuntime,
  RuntimeEvent,
  RuntimeRunContext,
} from '../src/modules/runtimes/runtime.port';

/**
 * A stand-in for ClaudeCodeRuntime registered under the real 'claude_code' key,
 * so employees are configured exactly as the §27 slice intends (Claude Code +
 * Opus/Sonnet) while the test runs without the live SDK. It branches on whether
 * the run is a CEO planning run or a developer execution run.
 */
class SliceClaudeCodeMock implements AgentRuntime {
  readonly key = 'claude_code';
  run(ctx: RuntimeRunContext): AsyncIterable<RuntimeEvent> {
    return ctx.workItemId.startsWith('plan:') ? this.plan(ctx) : this.build(ctx);
  }
  resume(_sessionId: string, ctx: RuntimeRunContext): AsyncIterable<RuntimeEvent> {
    return this.run(ctx);
  }
  private async *plan(ctx: RuntimeRunContext): AsyncIterable<RuntimeEvent> {
    yield { kind: 'session', sessionId: 'ceo' };
    await writeFile(
      path.join(ctx.cwd, 'PLAN.json'),
      JSON.stringify({
        project: 'Website',
        workItems: [
          {
            title: 'Build the Node/Express app',
            description: 'server + a passing test',
            taskType: 'coding',
          },
        ],
      }),
      'utf8',
    );
    yield { kind: 'usage', inputTokens: 60, outputTokens: 25, costUsd: 0.05 };
    yield { kind: 'completed', result: 'planned', sessionId: 'ceo' };
  }
  private async *build(ctx: RuntimeRunContext): AsyncIterable<RuntimeEvent> {
    yield { kind: 'session', sessionId: 'dev' };
    // A minimal Node/Express app with a passing test (no install needed to test).
    await writeFile(
      path.join(ctx.cwd, 'package.json'),
      JSON.stringify(
        { name: 'website', version: '1.0.0', scripts: { test: 'node test.js' } },
        null,
        2,
      ),
      'utf8',
    );
    await writeFile(
      path.join(ctx.cwd, 'lib.js'),
      'module.exports.greeting = () => "hello";\n',
      'utf8',
    );
    await writeFile(
      path.join(ctx.cwd, 'index.js'),
      'const { greeting } = require("./lib");\n// const express = require("express"); // app entry\nconsole.log(greeting());\n',
      'utf8',
    );
    await writeFile(
      path.join(ctx.cwd, 'test.js'),
      'const { greeting } = require("./lib");\nif (greeting() !== "hello") process.exit(1);\nprocess.exit(0);\n',
      'utf8',
    );
    yield { kind: 'tool_use', toolName: 'Write', toolUseId: 'w1', input: { path: 'index.js' } };
    yield { kind: 'usage', inputTokens: 200, outputTokens: 120, costUsd: 0.18 };
    yield { kind: 'completed', result: 'built', sessionId: 'dev' };
  }
}

describe('V1 vertical slice (§27) — end to end', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    // Override the real claude_code runtime with the mock for this run.
    app.get(RuntimeRegistry).register(new SliceClaudeCodeMock());
  });

  afterAll(async () => {
    await app.close();
  });

  it('runs the whole story: company -> CEO plan -> route -> execute -> evaluate -> profile -> UI', async () => {
    const server = app.getHttpServer();

    // (1) Create a company.
    const company = await request(server).post('/companies').send({ name: 'Acme AI' }).expect(201);
    const companyId = company.body.id;

    // (2) CEO on Claude Code / Opus.
    const ceo = await request(server)
      .post(`/companies/${companyId}/employees`)
      .send({
        name: 'Ada',
        role: 'CEO',
        department: 'Executive',
        runtimeConfig: {
          runtimeKey: 'claude_code',
          modelPolicy: {
            default: 'claude-opus-4-8',
            byTaskType: { architecture: 'claude-opus-4-8' },
          },
        },
        skills: [{ skillKey: 'strategy', level: 85 }],
      })
      .expect(201);

    // Developer on Claude Code / Sonnet.
    const dev = await request(server)
      .post(`/companies/${companyId}/employees`)
      .send({
        name: 'Grace',
        role: 'Backend Engineer',
        managerEmployeeId: ceo.body.id,
        runtimeConfig: {
          runtimeKey: 'claude_code',
          modelPolicy: {
            default: 'claude-sonnet-4-6',
            byTaskType: { coding: 'claude-sonnet-4-6' },
          },
        },
        skills: [
          { skillKey: 'node', level: 90 },
          { skillKey: 'sql', level: 80 },
        ],
      })
      .expect(201);

    // (3) Create a goal.
    const goal = await request(server)
      .post(`/companies/${companyId}/goals`)
      .send({ title: 'Build me a website' })
      .expect(201);

    // (4) Start the goal -> (5) CEO wakes and plans -> (6) work routed to the developer.
    await request(server).post(`/goals/${goal.body.id}/start`).expect(201);
    const plan = await app.get(HeartbeatWorker).onGoalStarted(goal.body.id);
    expect(plan!.workItems.length).toBeGreaterThanOrEqual(1);

    const workItemId = plan!.workItems[0].workItemId;
    expect(plan!.workItems[0].assignedTo).toBe(dev.body.id); // routed to the developer

    // (7,8,9) Developer executes in an isolated workspace; files created; run captured.
    const exec = await app.get(ExecutionWorker).runOnce();
    expect(exec?.status).toBe('completed');
    expect(exec?.workItemId).toBe(workItemId);
    expect(exec?.model).toBe('claude-sonnet-4-6'); // Omni Router picked the coding model
    expect(exec?.filesChanged).toContain('index.js');

    const devRun = (await app.get(AgentRunsService).findByWorkItem(workItemId))[0];
    expect(devRun.status).toBe('completed');
    expect(devRun.filesChangedCount).toBeGreaterThanOrEqual(1);
    expect(devRun.estimatedCostUsd).toBeGreaterThan(0);

    // (10) Evaluation runs the real build/test.
    const evaluation = await app.get(EvaluationWorker).evaluate(workItemId);
    expect(evaluation.status).toBe('passed');
    expect(evaluation.routedTo).toBe('done');

    const wi = await request(server).get(`/work-items/${workItemId}`).expect(200);
    expect(wi.body.status).toBe('done');

    // (11) The developer's performance profile updated from the objective result.
    const profile = await request(server).get(`/employees/${dev.body.id}/profile`).expect(200);
    expect(profile.body.reputation.overall).toBe(100);
    expect(profile.body.recentPerformance).toHaveLength(1);
    const node = profile.body.employee.skills.find(
      (s: { skillKey: string }) => s.skillKey === 'node',
    );
    expect(node.level).toBeGreaterThan(90);

    // (12) UI/observability surfaces the execution history + live status.
    const runs = await request(server).get(`/work-items/${workItemId}/runs`).expect(200);
    expect(runs.body[0].model).toBe('claude-sonnet-4-6');

    const overview = await request(server).get(`/companies/${companyId}/overview`).expect(200);
    expect(overview.body.employees).toHaveLength(2);
    const devView = overview.body.employees.find((e: { id: string }) => e.id === dev.body.id);
    expect(devView.defaultModel).toBe('claude-sonnet-4-6');
    expect(devView.latestRun.status).toBe('completed');

    // The CEO's planning run is recorded at the goal level (Opus).
    const ceoRun = await request(server).get(`/agent-runs/${plan!.ceoRunId}`).expect(200);
    expect(ceoRun.body.goalId).toBe(goal.body.id);
    expect(ceoRun.body.model).toBe('claude-opus-4-8');

    // The dashboard renders.
    const ui = await request(server).get('/ui').expect(200);
    expect(ui.text).toContain('Forge');
  });
});
