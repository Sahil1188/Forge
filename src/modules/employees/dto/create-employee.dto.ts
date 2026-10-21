import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
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
