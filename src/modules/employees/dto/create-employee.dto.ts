import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class RuntimeConfigDto {
  @IsOptional()
  @IsString()
  runtimeKey?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsObject()
  modelPolicy?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}

export class EmployeeSkillDto {
  @IsString()
  @MaxLength(100)
  skillKey!: string;

  @IsInt()
  @Min(0)
  @Max(100)
  level!: number;
}

/** Per-employee tool policy (spec §20), enforced by the runtime gate. */
export class GovernanceDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  allowedTools?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  deniedTools?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  approvalRequiredTools?: string[];
}

export class CreateEmployeeDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsString()
  @MaxLength(200)
  role!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsUUID()
  managerEmployeeId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RuntimeConfigDto)
  runtimeConfig?: RuntimeConfigDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmployeeSkillDto)
  skills?: EmployeeSkillDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => GovernanceDto)
  governance?: GovernanceDto;
}

/** Partial update. `managerEmployeeId: null` clears the reporting line; `governance` replaces the policy. */
export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  role?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsUUID()
  managerEmployeeId?: string | null;

  @IsOptional()
  @IsIn(['idle', 'working', 'paused_for_approval', 'error'])
  status?: 'idle' | 'working' | 'paused_for_approval' | 'error';

  @IsOptional()
  @ValidateNested()
  @Type(() => RuntimeConfigDto)
  runtimeConfig?: RuntimeConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => GovernanceDto)
  governance?: GovernanceDto;
}

export class SetSkillsDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => EmployeeSkillDto)
  skills!: EmployeeSkillDto[];
}

/** One edited brief. Every list holds short lines; empty lists are allowed except standards and workflow. */
export class EmployeeBriefDto {
  @IsString()
  @MinLength(10)
  @MaxLength(600)
  mission!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(25)
  @IsString({ each: true })
  @MaxLength(400, { each: true })
  standards!: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(25)
  @IsString({ each: true })
  @MaxLength(400, { each: true })
  workflow!: string[];

  @IsArray()
  @ArrayMaxSize(25)
  @IsString({ each: true })
  @MaxLength(400, { each: true })
  definitionOfDone!: string[];

  @IsArray()
  @ArrayMaxSize(25)
  @IsString({ each: true })
  @MaxLength(400, { each: true })
  never!: string[];

  @IsArray()
  @ArrayMaxSize(25)
  @IsString({ each: true })
  @MaxLength(400, { each: true })
  escalateWhen!: string[];

  @IsString()
  @MinLength(3)
  @MaxLength(600)
  deliverable!: string;
}
