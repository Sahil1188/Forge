import { IsIn, IsNumber, IsOptional, Min } from 'class-validator';
import type { BudgetPeriod } from '../budgets.schema';

export class SetBudgetDto {
  @IsOptional()
  @IsIn(['day', 'total'])
  period?: BudgetPeriod;

  @IsOptional()
  @IsNumber()
  @Min(0)
  softLimitUsd?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hardLimitUsd?: number;
}
