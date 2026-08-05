#!/usr/bin/env node
/**
 * Forge CLI — one entry point for standing the platform up and driving it.
 *
 *   forge up                 docker + migrate + seed (everything, one command)
 *   forge seed               (re)seed the demo company
 *   forge serve              start the HTTP server + /ui dashboard
 *   forge status             show companies, employees, and work items
 *   forge goal "<text>"      create a goal and drive it end-to-end, live
 *
 * `goal` runs the real pipeline in-process (CEO plans → routes → workers execute
 * → objective evaluation → performance/memory update), printing each step. It uses
 * the live runtime, so it needs Claude Code subscription auth for claude_code
 * employees: run `claude setup-token` and export CLAUDE_CODE_OAUTH_TOKEN first.
 * Billing note: Forge never sets ANTHROPIC_API_KEY — auth stays on your plan.
 */
import 'dotenv/config';
import { spawnSync } from 'node:child_process';

type Cmd = (args: string[]) => Promise<number> | number;

function sh(command: string, cmdArgs: string[]): number {
  const res = spawnSync(command, cmdArgs, { stdio: 'inherit', shell: true });
  return res.status ?? 1;
}

/**
 * Boot a headless Nest context with auto-triggers off so the CLI drives it.
 * We load the COMPILED app from dist/ (tsc emits the decorator metadata NestJS DI
 * needs; tsx/esbuild does not). Run `npm run build` — or `forge up` — first.
 */
async function bootContext() {
  process.env.FORGE_MANUAL_DRIVE = '1';
  const { existsSync } = await import('node:fs');
  const distApp = require('node:path').join(__dirname, '..', 'dist', 'app.module.js');
  if (!existsSync(distApp)) {
    console.error('Build not found. Run `npm run build` first (or `forge up`).');
    process.exit(1);
  }
  const { NestFactory } = await import('@nestjs/core');
  const { Logger } = await import('@nestjs/common');
  const { AppModule } = await import('../dist/app.module.js');
  return NestFactory.createApplicationContext(AppModule, {
    logger: process.env.FORGE_VERBOSE ? undefined : (['warn', 'error'] as any),
    abortOnError: false,
  }).catch((err) => {
    Logger.error(`Failed to start Forge context: ${(err as Error).message}`);
    throw err;
  });
}

const commands: Record<string, Cmd> = {
  up() {
    console.log('▶ forge up — building, bringing up Postgres, migrations, and seed data\n');
    let code = sh('npm', ['run', 'build']);
    if (code !== 0) return code;
    code = sh('docker', ['compose', 'up', '-d']);
    if (code !== 0) return code;
    console.log('\n⏳ waiting for Postgres to accept connections…');
    // Give the container a moment; migrate retries via its own connection.
    code = sh('npm', ['run', 'db:generate']);
    if (code !== 0) return code;
    code = sh('npm', ['run', 'db:migrate']);
    if (code !== 0) return code;
    code = sh('npm', ['run', 'db:seed']);
    if (code === 0) console.log('\n✅ Forge is up. Try:  forge goal "Build a Node/Express hello API with a test"');
    return code;
  },

  seed() {
    return sh('npm', ['run', 'db:seed']);
  },

  serve() {
    console.log('▶ forge serve — starting the HTTP server + /ui dashboard');
    return sh('npm', ['run', 'start:dev']);
  },

  async status() {
    const app = await bootContext();
    try {
      const { CompaniesService } = await import('../dist/modules/companies/companies.service.js');
      const { EmployeesService } = await import('../dist/modules/employees/employees.service.js');
      const companies = await app.get(CompaniesService).findAll();
      if (companies.length === 0) {
        console.log('No companies yet. Run `forge up` (or `forge seed`) to create the demo company.');
        return 0;
      }
      const employeesSvc = app.get(EmployeesService);
      for (const c of companies) {
        console.log(`\n🏢 ${c.name}  (${c.id})`);
        const roster = await employeesSvc.findByCompany(c.id);
        for (const e of roster) {
          console.log(`   • ${e.name} — ${e.role} [${e.status}]`);
        }
      }
      console.log('');
      return 0;
    } finally {
      await app.close();
    }
  },

  async goal(args: string[]) {
    const text = args.filter((a) => !a.startsWith('--')).join(' ').trim();
    if (!text) {
      console.error('Usage: forge goal "Build a Node/Express hello API with a test"');
      return 1;
    }
    const companyFlag = flag(args, '--company');

    const app = await bootContext();
    try {
      const { CompaniesService } = await import('../dist/modules/companies/companies.service.js');
      const { GoalsService } = await import('../dist/modules/goals/goals.service.js');
      const { CeoPlanner } = await import('../dist/modules/heartbeats/ceo-planner.service.js');
      const { ExecutionWorker } = await import('../dist/workers/execution.worker.js');
      const { EvaluationWorker } = await import('../dist/modules/evaluation/evaluation.worker.js');

      const companies = await app.get(CompaniesService).findAll();
      const company = companyFlag
        ? companies.find((c) => c.id === companyFlag)
        : companies[0];
      if (!company) {
        console.error('No company found. Run `forge up` (or `forge seed`) first.');
        return 1;
      }

      console.log(`\n🏢 Company: ${company.name}`);
      console.log(`🎯 Goal:    ${text}\n`);

      const goal = await app.get(GoalsService).create(company.id, { title: text });
      await app.get(GoalsService).start(goal.id);

      console.log('🧠 CEO planning the goal…');
      const plan = await app.get(CeoPlanner).plan(goal.id);
      console.log(`   → project ${plan.projectId} with ${plan.workItems.length} work item(s):`);
      for (const wi of plan.workItems) {
        console.log(`     - ${wi.workItemId}  →  ${wi.assignedTo ? `assigned ${wi.assignedTo}` : 'unassigned'}`);
      }

      const exec = app.get(ExecutionWorker);
      const evaluate = app.get(EvaluationWorker);

      console.log('\n⚙️  Executing work items…');
      for (let i = 0; i < 50; i += 1) {
        const summary = await exec.runOnce();
        if (!summary) break;
        console.log(
          `   • ${summary.workItemId} → ${summary.status} ` +
            `(${summary.runtimeKey}/${summary.model}, ${summary.filesChanged.length} files, $${summary.estimatedCostUsd.toFixed(4)})`,
        );
        if (summary.status === 'paused') {
          console.log(`     ⏸  needs approval ${summary.approvalId}. Approve via /ui or the API, then re-run.`);
          break;
        }
        if (summary.status === 'completed') {
          const ev = await evaluate.runOnce();
          if (ev) {
            console.log(
              `     ✓ evaluated: ${ev.status} (score ${ev.overallScore ?? 'n/a'}) → ${ev.routedTo}`,
            );
          }
        }
      }

      console.log('\n✅ Done. Inspect results at http://localhost:3000/ui (run `forge serve`).');
      console.log('   Workspaces with the produced files are under ./workspaces/runs/.');
      return 0;
    } catch (err) {
      console.error(`\n✗ ${(err as Error).message}`);
      if (/oauth|auth|credential|401|forbidden/i.test((err as Error).message)) {
        console.error('   This looks like an auth issue. Run `claude setup-token` and export CLAUDE_CODE_OAUTH_TOKEN.');
      }
      return 1;
    } finally {
      await app.close();
    }
  },
};

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

function usage(): void {
  console.log(
    [
      'Forge — Autonomous AI Workforce OS',
      '',
      'Usage: forge <command>',
      '',
      '  up               Postgres + migrate + seed (one command)',
      '  seed             (re)seed the demo company',
      '  serve            start the HTTP server + /ui dashboard',
      '  status           show companies, employees, work items',
      '  goal "<text>"    create a goal and drive it end-to-end, live',
      '',
      'Live runs need Claude Code auth: `claude setup-token` then export CLAUDE_CODE_OAUTH_TOKEN.',
    ].join('\n'),
  );
}

async function main(): Promise<void> {
  const [, , cmd, ...rest] = process.argv;
  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
    usage();
    process.exit(cmd ? 0 : 1);
  }
  const handler = commands[cmd];
  if (!handler) {
    console.error(`Unknown command: ${cmd}\n`);
    usage();
    process.exit(1);
  }
  const code = await handler(rest);
  process.exit(code);
}

void main();
