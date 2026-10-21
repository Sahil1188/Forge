import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { HeartbeatWorker } from './heartbeat.worker';

@Controller('goals')
export class HeartbeatsController {
  constructor(private readonly heartbeats: HeartbeatWorker) {}

  /** Explicitly wake the CEO to plan a goal (also triggered by goal.started). */
  @Post(':id/plan')
  plan(@Param('id', ParseUUIDPipe) id: string) {
    // A human asking is not a replayed event: always plan.
    return this.heartbeats.onGoalStarted(id, { force: true });
  }
}
