import { Injectable, Logger } from '@nestjs/common';

export interface DomainEventInput<T = Record<string, unknown>> {
  type: string;
  aggregateType: string;
  aggregateId: string;
  payload: T;
}

export interface DomainEvent<T = Record<string, unknown>> extends DomainEventInput<T> {
  occurredAt: string;
}

export type EventHandler = (event: DomainEvent) => void | Promise<void>;

/**
 * Minimal in-process pub/sub. Subscribe by exact event type, or '*' for all.
 * Deliberately simple (spec §22: no Kafka in V1); the interface can be swapped
 * for a real broker later without touching publishers/subscribers.
 */
@Injectable()
export class EventBus {
  private readonly logger = new Logger(EventBus.name);
  private readonly handlers = new Map<string, Set<EventHandler>>();

  subscribe(type: string, handler: EventHandler): () => void {
    const set = this.handlers.get(type) ?? new Set<EventHandler>();
    set.add(handler);
    this.handlers.set(type, set);
    return () => set.delete(handler);
  }

  async publish(event: DomainEvent): Promise<void> {
    const targets = [
      ...(this.handlers.get(event.type) ?? []),
      ...(this.handlers.get('*') ?? []),
    ];
    for (const handler of targets) {
      try {
        await handler(event);
      } catch (err) {
        this.logger.error(`Handler for ${event.type} failed: ${(err as Error).message}`);
      }
    }
  }
}
