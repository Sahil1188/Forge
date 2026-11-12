#!/usr/bin/env node
/**
 * Forge CLI — one entry point for standing the platform up and driving it.
 *
 *   forge up                 docker + migrate + seed (everything, one command)
 *   forge seed               (re)seed the demo company
 *   forge serve              start the HTTP server + /ui dashboard
 *   forge status             show companies and their employees
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
import { flag, flagAll, goalFields, goalText, hasFlag } from '../src/cli/args';
import { summarizeGoal, GoalItemOutcome } from '../src/cli/summary';

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

/** Where Forge itself is installed (this repository, or node_modules/forge). */
const PKG_ROOT = require('node:path').resolve(__dirname, '..');
const dist = (...parts: string[]) => require('node:path').join(PKG_ROOT, 'dist', ...parts);

/** Runs a compiled Forge script with this Node, in the user's folder (where .env and workspaces live). */
function node(script: string): number {
  return spawnSync(process.execPath, [script], { stdio: 'inherit' }).status ?? 1;
}

function needsBuild(): boolean {
  if (require('node:fs').existsSync(dist('main.js'))) return false;
  console.error('Forge is not built. In a clone, run `npm run build` first.');
  return true;
}

const commands: Record<string, Cmd> = {
  up() {
    console.log('▶ forge up — PostgreSQL, migrations and demo data\n');
    if (needsBuild()) return 1;
    const compose = require('node:path').join(PKG_ROOT, 'docker-compose.yml');
    let code = sh('docker', ['compose', '-f', `"${compose}"`, 'up', '-d', '--wait']);
    if (code !== 0) return code;
    code = node(dist('infrastructure', 'database', 'migrate.js'));
    if (code !== 0) return code;
    code = node(dist('infrastructure', 'database', 'seed.js'));
    if (code === 0)
      console.log('\n✅ Forge is up. Run `forge serve` and open http://127.0.0.1:3000');
    return code;
  },

  seed() {
    if (needsBuild()) return 1;
    return node(dist('infrastructure', 'database', 'seed.js'));
  },

  serve() {
    if (needsBuild()) return 1;
    console.log('▶ forge serve — http://127.0.0.1:' + (process.env.PORT ?? '3000'));
    return node(dist('main.js'));
  },

  async status() {
    const app = await bootContext();
    try {
      const { CompaniesService } = await import('../dist/modules/companies/companies.service.js');
      const { EmployeesService } = await import('../dist/modules/employees/employees.service.js');
      const companies = await app.get(CompaniesService).findAll();
      if (companies.length === 0) {
        console.log(
          'No companies yet. Run `forge up` (or `forge seed`) to create the demo company.',
        );
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

  /** Short task: one work item straight to the best-fit employee (no CEO planning run). */
  task(args: string[]) {
    return commands.goal([...args, '--direct']);
  },

  async goal(args: string[]) {
    const text = goalText(args);
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
      const company = companyFlag ? companies.find((c) => c.id === companyFlag) : companies[0];
      if (!company) {
        console.error('No company found. Run `forge up` (or `forge seed`) first.');
        return 1;
      }

      console.log(`\n🏢 Company: ${company.name}`);
      console.log(`🎯 Goal:    ${text}\n`);

      const direct = hasFlag(args, '--direct');
      const checks = flagAll(args, '--check');
      const goal = await app.get(GoalsService).create(company.id, {
        ...goalFields(text),
        mode: direct ? 'direct' : 'plan',
        acceptance: checks,
      });
      if (checks.length) console.log(`✔︎ Acceptance checks: ${checks.length}`);
      await app.get(GoalsService).start(goal.id);

      console.log(direct ? '⚡ Direct task — skipping CEO planning…' : '🧠 CEO planning the goal…');
      const plan = await app.get(CeoPlanner).plan(goal.id);
      console.log(`   → project ${plan.projectId} with ${plan.workItems.length} work item(s):`);
      for (const wi of plan.workItems) {
        console.log(
          `     - ${wi.title}  →  ${wi.assignedTo ? `assigned ${wi.assignedTo}` : 'UNASSIGNED (nobody can run it)'}  [${wi.workItemId}]`,
        );
      }

      const exec = app.get(ExecutionWorker);
      const evaluate = app.get(EvaluationWorker);

      const outcomes = new Map<string, GoalItemOutcome>(
        plan.workItems.map((w) => [
          w.workItemId,
          { workItemId: w.workItemId, finalStatus: 'created' },
        ]),
      );

      console.log('\n⚙️  Executing work items…');
      for (let i = 0; i < 50; i += 1) {
        const summary = await exec.runOnce();
        if (!summary) break;
        const outcome = outcomes.get(summary.workItemId) ?? {
          workItemId: summary.workItemId,
          finalStatus: 'created',
        };
        outcomes.set(summary.workItemId, outcome);
        outcome.execution = summary.status;
        console.log(
          `   • ${summary.workItemId} → ${summary.status} ` +
            `(${summary.runtimeKey}/${summary.model}, ${summary.filesChanged.length} files, $${summary.estimatedCostUsd.toFixed(4)})`,
        );
        if (summary.status === 'paused') {
          console.log(
            `     ⏸  needs approval ${summary.approvalId}. Approve via /ui or the API, then re-run.`,
          );
          continue; // other independent items can still run
        }
        if (summary.status === 'completed') {
          const ev = await evaluate.evaluate(summary.workItemId);
          outcome.evaluation = ev.status;
          console.log(
            `     ✓ evaluated: ${ev.status} (score ${ev.overallScore ?? 'n/a'}) → ${ev.routedTo}`,
          );
          if (ev.routedTo === 'rework') {
            // Same as the server's auto-chain: retry with the lesson learned, up to the limit.
            const next = await evaluate.retryOrFail(summary.workItemId);
            console.log(
              `     ↻ ${next === 'retried' ? 'retrying with the failure in memory' : 'giving up after max attempts'}`,
            );
          }
        }
      }

      const { WorkService } = await import('../dist/modules/work/work.service.js');
      for (const o of outcomes.values()) {
        o.finalStatus = (await app.get(WorkService).findOne(o.workItemId)).status;
      }
      const result = summarizeGoal([...outcomes.values()]);
      console.log(`\n${result.ok ? '✅' : '⚠️ '} ${result.lines.join('\n')}`);
      const { LocalWorktreeWorkspace } =
        await import('../dist/modules/workspaces/local-worktree.workspace.js');
      console.log(
        `   Deliverable (project main): ${app.get(LocalWorktreeWorkspace).projectPath(plan.projectId)}`,
      );
      return result.exitCode;
    } catch (err) {
      console.error(`\n✗ ${(err as Error).message}`);
      if (/oauth|auth|credential|401|forbidden/i.test((err as Error).message)) {
        console.error(
          '   This looks like an auth issue. Run `claude setup-token` and export CLAUDE_CODE_OAUTH_TOKEN.',
        );
      }
      return 1;
    } finally {
      await app.close();
    }
  },
};

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
      '  status           show companies and their employees',
      '  goal "<text>"    the CEO plans it, employees build it, end-to-end, live',
      '  task "<text>"    a short task: one employee, no planning step (fast, cheap)',
      '                   options: --check "<cmd>" (repeatable, must exit 0)  --company <id>',
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
