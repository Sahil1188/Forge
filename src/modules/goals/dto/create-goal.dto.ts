import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

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
}
