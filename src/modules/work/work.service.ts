import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { DRIZZLE, Database } from '../../infrastructure/database/drizzle.provider';
import { OutboxService } from '../../infrastructure/events/outbox.service';
import { EventTypes } from '../../infrastructure/events/event-types';
import { EmployeesService } from '../employees/employees.service';
import { ProjectsService } from '../projects/projects.service';
import {
  workItems,
  workDependencies,
  workAssignments,
  WorkItem,
  WorkItemWithRelations,
} from './work.schema';
import { assertTransition, InvalidTransitionError, WorkItemStatus } from './work-status';
import {
  AddDependencyDto,
  AssignWorkDto,
  ChangeStatusDto,
  CreateWorkItemDto,
} from './dto/work.dto';

@Injectable()
export class WorkService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly projects: ProjectsService,
    private readonly employees: EmployeesService,
    private readonly outbox: OutboxService,
  ) {}

  async createWorkItem(projectId: string, dto: CreateWorkItemDto): Promise<WorkItem> {
    const project = await this.projects.findOne(projectId);
    return this.db.transaction(async (tx) => {
      const [item] = await tx
        .insert(workItems)
        .values({
          projectId,
          companyId: project.companyId,
          title: dto.title,
          description: dto.description ?? null,
          taskType: dto.taskType ?? 'generic',
          priority: dto.priority ?? 0,
          acceptance: dto.acceptance ?? [],
        })
        .returning();
      await this.outbox.record(tx, {
        type: EventTypes.WorkCreated,
        aggregateType: 'work_item',
        aggregateId: item.id,
        payload: { projectId, companyId: project.companyId, taskType: item.taskType },
      });
      return item;
    });
  }

  async assign(workItemId: string, dto: AssignWorkDto): Promise<WorkItem> {
    const item = await this.getRaw(workItemId);
    const employee = await this.employees.findOne(dto.employeeId);
    if (employee.companyId !== item.companyId) {
      throw new BadRequestException(
        `Employee ${employee.id} belongs to a different company than work item ${item.id}`,
      );
    }
    this.assertStatus(item.status, 'assigned');

    return this.db.transaction(async (tx) => {
      await tx.insert(workAssignments).values({
        workItemId,
        employeeId: dto.employeeId,
        assignedBy: dto.assignedBy ?? null,
      });
      const [updated] = await tx
        .update(workItems)
        .set({ assignedEmployeeId: dto.employeeId, status: 'assigned' })
        .where(eq(workItems.id, workItemId))
        .returning();
      await this.outbox.record(tx, {
        type: EventTypes.WorkAssigned,
        aggregateType: 'work_item',
        aggregateId: workItemId,
        payload: { employeeId: dto.employeeId },
      });
      return updated;
    });
  }

  async changeStatus(workItemId: string, dto: ChangeStatusDto): Promise<WorkItem> {
    const item = await this.getRaw(workItemId);
    this.assertStatus(item.status, dto.status);

    return this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(workItems)
        .set({ status: dto.status })
        .where(eq(workItems.id, workItemId))
        .returning();
      await this.outbox.record(tx, {
        type: EventTypes.WorkStatusChanged,
        aggregateType: 'work_item',
        aggregateId: workItemId,
        payload: { from: item.status, to: dto.status },
      });
      return updated;
    });
  }

  async addDependency(workItemId: string, dto: AddDependencyDto): Promise<void> {
    if (workItemId === dto.dependsOnWorkItemId) {
      throw new BadRequestException('A work item cannot depend on itself');
    }
    const item = await this.getRaw(workItemId);
    const target = await this.getRaw(dto.dependsOnWorkItemId);
    if (item.companyId !== target.companyId) {
      throw new BadRequestException('A work item cannot depend on another company’s work');
    }
    // A cycle (A→B→…→A) would leave the whole chain permanently blocked.
    if (await this.reaches(dto.dependsOnWorkItemId, workItemId)) {
      throw new BadRequestException('Dependency would create a cycle');
    }
    await this.db
      .insert(workDependencies)
      .values({ workItemId, dependsOnWorkItemId: dto.dependsOnWorkItemId })
      .onConflictDoNothing();
  }

  async findByProject(projectId: string): Promise<WorkItem[]> {
    return this.db.select().from(workItems).where(eq(workItems.projectId, projectId));
  }

  async findOne(id: string): Promise<WorkItemWithRelations> {
    const item = await this.getRaw(id);
    const dependencies = await this.db
      .select()
      .from(workDependencies)
      .where(eq(workDependencies.workItemId, id));
    return { ...item, dependencies };
  }

  /** True when `from` already depends (transitively) on `target`. */
  private async reaches(from: string, target: string): Promise<boolean> {
    const seen = new Set<string>([from]);
    let frontier = [from];
    while (frontier.length > 0) {
      const edges = await this.db
        .select({ next: workDependencies.dependsOnWorkItemId })
        .from(workDependencies)
        .where(inArray(workDependencies.workItemId, frontier));
      frontier = [];
      for (const { next } of edges) {
        if (next === target) return true;
        if (!seen.has(next)) {
          seen.add(next);
          frontier.push(next);
        }
      }
    }
    return false;
  }

  private async getRaw(id: string): Promise<WorkItem> {
    const [item] = await this.db.select().from(workItems).where(eq(workItems.id, id));
    if (!item) {
      throw new NotFoundException(`Work item ${id} not found`);
    }
    return item;
  }

  /**
   * Hands a queued (assigned, not yet started) item to another employee of the same company, e.g. a
   * teammate in the same role who is free, so ready work does not wait for one busy person.
   */
  async reassign(workItemId: string, employeeId: string, assignedBy: string): Promise<WorkItem> {
    const item = await this.getRaw(workItemId);
    if (item.status !== 'assigned')
      throw new BadRequestException(`Work item ${workItemId} is ${item.status}, not queued`);
    const employee = await this.employees.findOne(employeeId);
    if (employee.companyId !== item.companyId)
      throw new BadRequestException('Employee belongs to a different company');
    return this.db.transaction(async (tx) => {
      await tx.insert(workAssignments).values({ workItemId, employeeId, assignedBy });
      const [updated] = await tx
        .update(workItems)
        .set({ assignedEmployeeId: employeeId })
        .where(eq(workItems.id, workItemId))
        .returning();
      return updated;
    });
  }

  private assertStatus(from: WorkItemStatus, to: WorkItemStatus): void {
    try {
      assertTransition(from, to);
    } catch (err) {
      if (err instanceof InvalidTransitionError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }
}
