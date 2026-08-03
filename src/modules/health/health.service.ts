import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE, Database } from '../../infrastructure/database/drizzle.provider';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  db: 'up' | 'down';
}

@Injectable()
export class HealthService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async check(): Promise<HealthStatus> {
    try {
      await this.db.execute(sql`select 1`);
      return { status: 'ok', db: 'up' };
    } catch {
      return { status: 'degraded', db: 'down' };
    }
  }
}
