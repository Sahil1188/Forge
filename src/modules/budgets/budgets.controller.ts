import { Body, Controller, Get, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { SetBudgetDto } from './dto/set-budget.dto';

@Controller('employees/:employeeId/budget')
export class BudgetsController {
  constructor(private readonly budgets: BudgetsService) {}

  @Put()
  set(@Param('employeeId', ParseUUIDPipe) employeeId: string, @Body() dto: SetBudgetDto) {
    return this.budgets.setBudget(employeeId, dto);
  }

  @Get()
  status(@Param('employeeId', ParseUUIDPipe) employeeId: string) {
    return this.budgets.check(employeeId);
  }
}
