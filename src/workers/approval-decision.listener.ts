import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventBus } from '../infrastructure/events/event-bus';
import { EventTypes } from '../infrastructure/events/event-types';
import { ExecutionWorker } from './execution.worker';

/**
 * Prod wiring: when an approval is approved or denied, apply the decision to the
 * paused run (resume or halt). In tests the decision is applied directly for
 * determinism, so this listener stays dormant unless the outbox is flushed.
 */
@Injectable()
export class ApprovalDecisionListener implements OnModuleInit {
  constructor(
    private readonly bus: EventBus,
    private readonly worker: ExecutionWorker,
  ) {}

  onModuleInit(): void {
    const handler = (event: { payload: Record<string, unknown> }) => {
      const agentRunId = event.payload?.agentRunId as string | undefined;
      if (agentRunId) {
        void this.worker.onApprovalDecision(agentRunId);
      }
    };
    this.bus.subscribe(EventTypes.ApprovalApproved, handler);
    this.bus.subscribe(EventTypes.ApprovalDenied, handler);
  }
}
