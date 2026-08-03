import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class DecideApprovalDto {
  @IsIn(['approved', 'denied'])
  decision!: 'approved' | 'denied';

  @IsOptional()
  @IsUUID()
  decidedByUserId?: string;
}
