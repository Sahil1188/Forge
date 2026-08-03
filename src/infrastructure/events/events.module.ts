import { Global, Module } from '@nestjs/common';
import { EventBus } from './event-bus';
import { OutboxService } from './outbox.service';
import { OutboxDispatcher } from './outbox.dispatcher';

@Global()
@Module({
  providers: [EventBus, OutboxService, OutboxDispatcher],
  exports: [EventBus, OutboxService, OutboxDispatcher],
})
export class EventsModule {}
