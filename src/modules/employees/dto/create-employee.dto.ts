import { Type } from 'class-transformer';
import {
  IsArray,
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
  skillKey!: string;

  @IsInt()
  @Min(0)
  @Max(100)
  level!: number;
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
}
