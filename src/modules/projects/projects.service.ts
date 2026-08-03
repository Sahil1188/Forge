import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, Database } from '../../infrastructure/database/drizzle.provider';
import { OutboxService } from '../../infrastructure/events/outbox.service';
import { EventTypes } from '../../infrastructure/events/event-types';
import { GoalsService } from '../goals/goals.service';
import { projects, Project } from './projects.schema';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly goals: GoalsService,
    private readonly outbox: OutboxService,
  ) {}

  async create(goalId: string, dto: CreateProjectDto): Promise<Project> {
    const goal = await this.goals.findOne(goalId);
    return this.db.transaction(async (tx) => {
      const [project] = await tx
        .insert(projects)
        .values({ goalId, companyId: goal.companyId, name: dto.name })
        .returning();
      await this.outbox.record(tx, {
        type: EventTypes.ProjectCreated,
        aggregateType: 'project',
        aggregateId: project.id,
        payload: { goalId, companyId: goal.companyId, name: project.name },
      });
      return project;
    });
  }

  async findByGoal(goalId: string): Promise<Project[]> {
    return this.db.select().from(projects).where(eq(projects.goalId, goalId));
  }

  async findOne(id: string): Promise<Project> {
    const [project] = await this.db.select().from(projects).where(eq(projects.id, id));
    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }
    return project;
  }
}
