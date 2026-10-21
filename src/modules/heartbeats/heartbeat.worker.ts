import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, Database } from '../../infrastructure/database/drizzle.provider';
import { EventBus } from '../../infrastructure/events/event-bus';
import { EventTypes } from '../../infrastructure/events/event-types';
import { GoalsService } from '../goals/goals.service';
import { heartbeats } from './heartbeats.schema';
import { CeoPlanner, PlanResult } from './ceo-planner.service';

/** A `fired` heartbeat younger than this is assumed to still be planning (older ones crashed). */
const IN_FLIGHT_WINDOW_MS = 30 * 60 * 1000;

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
    // Prod trigger: a started goal wakes the CEO. Tests and the CLI call
    // onGoalStarted()/plan() directly (the outbox isn't flushed under them).
    if (process.env.VITEST || process.env.FORGE_MANUAL_DRIVE) {
      return;
    }
    this.enableAutoRun();
  }

  private autoRun = false;

  /** Prod auto-chain (also callable from tests): a started goal wakes the CEO. */
  enableAutoRun(): void {
    if (this.autoRun) return;
    this.autoRun = true;
    this.bus.subscribe(EventTypes.GoalStarted, (event) => {
      void this.onGoalStarted(event.aggregateId).catch((err) =>
        this.logger.error(`Heartbeat planning failed: ${(err as Error).message}`),
      );
    });
  }

  /**
   * Wakes the CEO for a goal. Idempotent by default: the outbox is at-least-once (and replays
   * after restarts), so a goal that is already planned — or being planned — is skipped.
   * `force` is for an explicit human request to re-plan.
   */
  /** A goal is "planned" once a heartbeat finished, or one fired recently and may still be running. */
  private async alreadyPlanned(goalId: string): Promise<boolean> {
    const beats = await this.db.select().from(heartbeats).where(eq(heartbeats.goalId, goalId));
    const recent = Date.now() - IN_FLIGHT_WINDOW_MS;
    return beats.some(
      (b) => b.status === 'done' || (b.status === 'fired' && (b.firedAt?.getTime() ?? 0) > recent),
    );
  }

  async onGoalStarted(goalId: string, opts: { force?: boolean } = {}): Promise<PlanResult | null> {
    const goal = await this.goals.findOne(goalId);
    if (!opts.force && (await this.alreadyPlanned(goalId))) {
      this.logger.log(`Goal ${goalId} already planned (or planning); skipping duplicate trigger`);
      return null;
    }
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
