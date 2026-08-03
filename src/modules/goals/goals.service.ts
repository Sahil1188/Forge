import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE, Database } from '../../infrastructure/database/drizzle.provider';
import { OutboxService } from '../../infrastructure/events/outbox.service';
import { EventTypes } from '../../infrastructure/events/event-types';
import { CompaniesService } from '../companies/companies.service';
import { goals, Goal } from './goals.schema';
import { CreateGoalDto } from './dto/create-goal.dto';

@Injectable()
export class GoalsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly companies: CompaniesService,
    private readonly outbox: OutboxService,
  ) {}

  async create(companyId: string, dto: CreateGoalDto): Promise<Goal> {
    await this.companies.findOne(companyId);
    return this.db.transaction(async (tx) => {
      const [goal] = await tx
        .insert(goals)
        .values({
          companyId,
          title: dto.title,
          description: dto.description ?? null,
          createdByUserId: dto.createdByUserId ?? null,
        })
        .returning();
      await this.outbox.record(tx, {
        type: EventTypes.GoalCreated,
        aggregateType: 'goal',
        aggregateId: goal.id,
        payload: { companyId, title: goal.title },
      });
      return goal;
    });
  }

  async start(id: string): Promise<Goal> {
    const goal = await this.findOne(id);
    if (goal.status === 'completed' || goal.status === 'cancelled') {
      throw new BadRequestException(`Goal ${id} is ${goal.status} and cannot be started`);
    }
    return this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(goals)
        .set({ status: 'active' })
        .where(eq(goals.id, id))
        .returning();
      await this.outbox.record(tx, {
        type: EventTypes.GoalStarted,
        aggregateType: 'goal',
        aggregateId: id,
        payload: { companyId: goal.companyId },
      });
      return updated;
    });
  }

  async findByCompany(companyId: string): Promise<Goal[]> {
    return this.db.select().from(goals).where(eq(goals.companyId, companyId));
  }

  async findOne(id: string): Promise<Goal> {
    const [goal] = await this.db.select().from(goals).where(and(eq(goals.id, id)));
    if (!goal) {
      throw new NotFoundException(`Goal ${id} not found`);
    }
    return goal;
  }
}
