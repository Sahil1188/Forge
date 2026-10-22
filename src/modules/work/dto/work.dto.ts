import { ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { TASK_TYPES, TaskType } from '../domains';
import type { WorkItemStatus } from '../work-status';

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

  /** Shell commands that must exit 0 for the item to pass evaluation. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  acceptance?: string[];
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
