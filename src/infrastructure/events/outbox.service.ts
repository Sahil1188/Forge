import { Injectable } from '@nestjs/common';
import { Database } from '../database/drizzle.provider';
import { events } from './events.schema';
import { DomainEventInput } from './event-bus';

/** Any drizzle handle capable of inserting — the base db or a transaction. */
export type Executor = Pick<Database, 'insert'>;

@Injectable()
export class OutboxService {
  /**
   * Records an event into the outbox. Pass the surrounding transaction (`tx`) so
   * the event is committed atomically with the aggregate write.
   */
  async record(exec: Executor, event: DomainEventInput): Promise<void> {
    await exec.insert(events).values({
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      type: event.type,
      payload: event.payload,
    });
  }
}
