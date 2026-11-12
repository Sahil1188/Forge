import 'dotenv/config';
import { existsSync } from 'node:fs';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

/**
 * Standalone migration runner (invoked via `npm run db:migrate`).
 * Tolerant of the pre-M1 state where no migrations exist yet.
 */
async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }

  if (!existsSync('./drizzle/meta/_journal.json')) {
    console.log(
      '[migrate] no migrations to apply yet (run `npm run db:generate` after adding tables)',
    );
    return;
  }

  // `onnotice: noop` suppresses harmless "already exists, skipping" NOTICEs from
  // drizzle's idempotent CREATE IF NOT EXISTS bootstrap statements.
  const client = postgres(url, { max: 1, onnotice: () => {} });
  try {
    const db = drizzle(client);
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('[migrate] migrations applied');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('[migrate] failed:', err);
  process.exit(1);
});
