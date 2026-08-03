import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { createDb } from './connection';
import { users, companies } from '../../modules/companies/companies.schema';
import {
  employees,
  employeeRuntimeConfigs,
  employeeSkills,
} from '../../modules/employees/employees.schema';

/**
 * Dev seed for the V1 slice: one company, a CEO (Claude Code / Opus policy) and a
 * Backend Engineer (Claude Code / Sonnet policy) reporting to the CEO.
 */
async function main(): Promise<void> {
  const { db, client } = createDb();
  try {
    const [insertedUser] = await db
      .insert(users)
      .values({ email: 'founder@forge.local', name: 'Founder' })
      .onConflictDoNothing()
      .returning();
    const owner =
      insertedUser ??
      (await db.select().from(users).where(eq(users.email, 'founder@forge.local')))[0];

    const [company] = await db
      .insert(companies)
      .values({ name: 'Acme AI', description: 'Demo company', ownerUserId: owner.id })
      .returning();

    // CEO — pinned to Claude Code + Claude (Opus for architecture, Sonnet for coding).
    const [ceoRc] = await db
      .insert(employeeRuntimeConfigs)
      .values({
        runtimeKey: 'claude_code',
        provider: 'anthropic',
        modelPolicy: {
          default: 'claude-opus-4-8',
          byTaskType: { architecture: 'claude-opus-4-8', coding: 'claude-sonnet-4-6' },
        },
        settings: { permissionMode: 'default', maxTurns: 40 },
      })
      .returning();
    const [ceo] = await db
      .insert(employees)
      .values({
        companyId: company.id,
        name: 'Ada',
        role: 'CEO',
        department: 'Executive',
        runtimeConfigId: ceoRc.id,
        autonomy: { canDelegate: true, heartbeat: 'on_goal' },
        governance: { approvalRequired: ['production_deploy'] },
      })
      .returning();
    await db.insert(employeeSkills).values([
      { employeeId: ceo.id, skillKey: 'strategy', level: 80 },
      { employeeId: ceo.id, skillKey: 'architecture', level: 75 },
    ]);

    // Backend Engineer — Claude Code, Sonnet default, reports to the CEO.
    const [devRc] = await db
      .insert(employeeRuntimeConfigs)
      .values({
        runtimeKey: 'claude_code',
        provider: 'anthropic',
        modelPolicy: {
          default: 'claude-sonnet-4-6',
          byTaskType: { coding: 'claude-sonnet-4-6', boilerplate: 'claude-haiku-4-5' },
        },
        settings: { permissionMode: 'default', maxTurns: 60 },
      })
      .returning();
    const [dev] = await db
      .insert(employees)
      .values({
        companyId: company.id,
        name: 'Grace',
        role: 'Backend Engineer',
        department: 'Engineering',
        managerEmployeeId: ceo.id,
        runtimeConfigId: devRc.id,
        governance: { githubRead: true, githubWrite: true, productionDeploy: 'approval_required' },
      })
      .returning();
    await db.insert(employeeSkills).values([
      { employeeId: dev.id, skillKey: 'java', level: 70 },
      { employeeId: dev.id, skillKey: 'spring', level: 65 },
      { employeeId: dev.id, skillKey: 'sql', level: 60 },
      { employeeId: dev.id, skillKey: 'node', level: 68 },
    ]);

    // A worker on CustomRuntime (M11): the Omni Router picks the model per task;
    // provider is a local LLM here. CEO/leads stay pinned to Claude Code.
    const [workerRc] = await db
      .insert(employeeRuntimeConfigs)
      .values({
        runtimeKey: 'custom',
        provider: 'ollama',
        modelPolicy: {
          default: 'qwen2.5-coder',
          byComplexity: { high: 'qwen2.5-coder:32b', low: 'qwen2.5-coder:7b' },
          complexityThreshold: 0.6,
        },
        settings: { maxTurns: 40 },
      })
      .returning();
    const [worker] = await db
      .insert(employees)
      .values({
        companyId: company.id,
        name: 'Kai',
        role: 'Frontend Engineer',
        department: 'Engineering',
        managerEmployeeId: ceo.id,
        runtimeConfigId: workerRc.id,
        governance: { githubRead: true, githubWrite: true, approvalRequiredTools: ['run_command'] },
      })
      .returning();
    await db.insert(employeeSkills).values([
      { employeeId: worker.id, skillKey: 'react', level: 72 },
      { employeeId: worker.id, skillKey: 'typescript', level: 70 },
    ]);

    console.log(`[seed] company=${company.id} ceo=${ceo.id} dev=${dev.id} worker=${worker.id}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
