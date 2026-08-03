import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { asc, eq, isNull } from 'drizzle-orm';
import { DRIZZLE, Database } from '../database/drizzle.provider';
import { events } from './events.schema';
import { EventBus } from './event-bus';

/**
 * Polls the outbox for unpublished events and forwards them to the EventBus,
 * stamping `published_at`. Runs on an interval in production; tests call
 * `tick()` directly for determinism.
 */
@Injectable()
export class OutboxDispatcher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxDispatcher.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly bus: EventBus,
  ) {}

  onModuleInit(): void {
    // Tests drive tick() directly; skip the auto-interval under the test runner
    // to avoid polling a pool that is being torn down at app.close().
    if (process.env.VITEST) {
      return;
    }
    this.timer = setInterval(() => {
      void this.tick();
    }, 1000);
    // Do not keep the process alive solely for the dispatcher.
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  /** Publishes pending events; returns how many were dispatched. */
  async tick(): Promise<number> {
    if (this.running) {
      return 0;
    }
    this.running = true;
    try {
      const pending = await this.db
        .select()
        .from(events)
        .where(isNull(events.publishedAt))
        .orderBy(asc(events.createdAt))
        .limit(50);

      for (const row of pending) {
        await this.bus.publish({
          type: row.type,
          aggregateType: row.aggregateType,
          aggregateId: row.aggregateId,
          payload: row.payload,
          occurredAt: row.createdAt.toISOString(),
        });
        await this.db
          .update(events)
          .set({ publishedAt: new Date() })
          .where(eq(events.id, row.id));
      }
      return pending.length;
    } catch (err) {
      this.logger.error(`Outbox dispatch failed: ${(err as Error).message}`);
      return 0;
    } finally {
      this.running = false;
    }
  }
}
