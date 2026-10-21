import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import type { GoalMode } from '../goals.schema';

export class CreateGoalDto {
  @IsString()
  @MaxLength(300)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  createdByUserId?: string;

  /** `direct` skips CEO planning: one work item, straight to the best-fit employee. */
  @IsOptional()
  @IsIn(['plan', 'direct'])
  mode?: GoalMode;

  /** Shell commands that must exit 0 once the goal is delivered (prefer `node -e …` for portability). */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  acceptance?: string[];
}
