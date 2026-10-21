import postgres from 'postgres';
import { afterAll, beforeAll } from 'vitest';

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
  } finally {
    await sql.end({ timeout: 2 });
  }
}

beforeAll(clearQueue);
afterAll(clearQueue);
