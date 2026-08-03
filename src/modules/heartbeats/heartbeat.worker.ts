import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, Database } from '../../infrastructure/database/drizzle.provider';
import { EventBus } from '../../infrastructure/events/event-bus';
import { EventTypes } from '../../infrastructure/events/event-types';
import { GoalsService } from '../goals/goals.service';
import { heartbeats } from './heartbeats.schema';
import { CeoPlanner, PlanResult } from './ceo-planner.service';

/**
 * Wakes the CEO when a goal starts (spec §27 step 4). V1 fires the heartbeat
 * immediately; the schedule/interval model can grow later.
 */
@Injectable()
export class HeartbeatWorker implements OnModuleInit {
  private readonly logger = new Logger(HeartbeatWorker.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly bus: EventBus,
    private readonly goals: GoalsService,
    private readonly planner: CeoPlanner,
  ) {}

  onModuleInit(): void {
    // Prod trigger: a started goal wakes the CEO. Tests call onGoalStarted()
    // directly (the outbox isn't flushed under the runner).
    if (process.env.VITEST) {
      return;
    }
    this.bus.subscribe(EventTypes.GoalStarted, (event) => {
      void this.onGoalStarted(event.aggregateId).catch((err) =>
        this.logger.error(`Heartbeat planning failed: ${(err as Error).message}`),
      );
    });
  }

  async onGoalStarted(goalId: string): Promise<PlanResult | null> {
    const goal = await this.goals.findOne(goalId);
    const ceo = await this.planner.findCeo(goal.companyId);
    if (!ceo) {
      this.logger.warn(`No CEO for company ${goal.companyId}; cannot plan goal ${goalId}`);
      return null;
    }

    const [heartbeat] = await this.db
      .insert(heartbeats)
      .values({ employeeId: ceo.id, goalId, firedAt: new Date(), status: 'fired' })
      .returning();

    try {
      const result = await this.planner.plan(goalId, ceo);
      await this.db.update(heartbeats).set({ status: 'done' }).where(eq(heartbeats.id, heartbeat.id));
      return result;
    } catch (err) {
      await this.db
        .update(heartbeats)
        .set({ status: 'failed' })
        .where(eq(heartbeats.id, heartbeat.id));
      throw err;
    }
  }
}
