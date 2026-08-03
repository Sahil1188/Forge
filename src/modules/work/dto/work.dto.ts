import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import type { TaskType } from '../work.schema';
import type { WorkItemStatus } from '../work-status';

const TASK_TYPES: TaskType[] = ['architecture', 'coding', 'review', 'devops', 'qa', 'generic'];
const WORK_STATUSES: WorkItemStatus[] = [
  'created',
  'assigned',
  'in_progress',
  'needs_approval',
  'evaluating',
  'rework',
  'done',
  'failed',
  'cancelled',
];

export class CreateWorkItemDto {
  @IsString()
  @MaxLength(300)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(TASK_TYPES)
  taskType?: TaskType;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  priority?: number;
}

export class AssignWorkDto {
  @IsUUID()
  employeeId!: string;

  @IsOptional()
  @IsString()
  assignedBy?: string;
}

export class ChangeStatusDto {
  @IsIn(WORK_STATUSES)
  status!: WorkItemStatus;
}

export class AddDependencyDto {
  @IsUUID()
  dependsOnWorkItemId!: string;
}
