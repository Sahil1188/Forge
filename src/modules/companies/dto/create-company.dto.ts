import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  ownerUserId?: string;
}

export class UpdateCompanyDto {
  /** Folder where this company's projects are created; empty string resets to the Forge default. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  projectsDir?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
