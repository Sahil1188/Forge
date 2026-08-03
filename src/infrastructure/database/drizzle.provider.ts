import { Provider, Logger } from '@nestjs/common';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/** DI token for the Drizzle database handle. */
export const DRIZZLE = Symbol('DRIZZLE');
/** DI token for the underlying postgres.js client (needed to close the pool). */
export const PG_CLIENT = Symbol('PG_CLIENT');

export type Database = PostgresJsDatabase<typeof schema>;

export const pgClientProvider: Provider = {
  provide: PG_CLIENT,
  useFactory: () => {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL is not set');
    }
    return postgres(url, { max: 10 });
  },
};

export const drizzleProvider: Provider = {
  provide: DRIZZLE,
  inject: [PG_CLIENT],
  useFactory: (client: ReturnType<typeof postgres>): Database => {
    Logger.log('Drizzle client initialized', 'Database');
    return drizzle(client, { schema });
  },
};
