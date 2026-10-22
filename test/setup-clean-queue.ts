import postgres from 'postgres';
import { afterAll, beforeAll } from 'vitest';
import * as os from 'node:os';
import * as path from 'node:path';

// Projects created by tests go to a temp folder, never the operator's real ~/Forge Projects.
process.env.FORGE_PROJECTS_DIR ??= path.join(os.tmpdir(), 'forge-test-projects');
// Scripted runs start no processes; skip the per-run PowerShell sweep to keep the suite fast.
process.env.FORGE_SKIP_PROCESS_CLEANUP ??= '1';
// Suites assert exact plans; the production-review step has its own tests that switch it on.
process.env.FORGE_PRODUCTION_REVIEW ??= '0';

/**
 * The execution queue is global (one DB, `assigned` work from any company). A spec that plans
 * or assigns work and doesn't run it would otherwise be picked up by the next spec's worker.
 * Clear stray runnable work before and after every spec file.
 */
async function clearQueue(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const sql = postgres(url, { max: 1 });
  try {
    await sql`update work_items set status = 'cancelled' where status = 'assigned'`;
    // Accounts switch on login for everyone: each spec file starts in local (no-account) mode.
    await sql`delete from sessions`.catch(() => undefined);
    await sql`delete from memberships`.catch(() => undefined);
    await sql`update users set password_hash = null`.catch(() => undefined);
  } finally {
    await sql.end({ timeout: 2 });
  }
}

beforeAll(clearQueue);
afterAll(clearQueue);
