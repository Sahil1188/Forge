import { describe, it, expect, vi } from 'vitest';
import { HealthService } from './health.service';
import type { Database } from '../../infrastructure/database/drizzle.provider';

describe('HealthService', () => {
  it('reports ok when the database responds', async () => {
    const db = { execute: vi.fn().mockResolvedValue([{ '?column?': 1 }]) } as unknown as Database;
    const svc = new HealthService(db);
    await expect(svc.check()).resolves.toEqual({ status: 'ok', db: 'up' });
  });

  it('reports degraded when the database throws', async () => {
    const db = { execute: vi.fn().mockRejectedValue(new Error('down')) } as unknown as Database;
    const svc = new HealthService(db);
    await expect(svc.check()).resolves.toEqual({ status: 'degraded', db: 'down' });
  });
});
