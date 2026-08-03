import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

/**
 * Standalone Drizzle connection for scripts (seed, migrate) that run outside the
 * NestJS DI container. Callers must `await client.end()` when done.
 */
export function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });
  return { db, client };
}
