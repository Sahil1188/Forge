import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';

@Controller()
export class GoalsController {
  constructor(private readonly goals: GoalsService) {}

  @Post('companies/:companyId/goals')
  create(@Param('companyId', ParseUUIDPipe) companyId: string, @Body() dto: CreateGoalDto) {
    return this.goals.create(companyId, dto);
  }

  @Get('companies/:companyId/goals')
  findByCompany(@Param('companyId', ParseUUIDPipe) companyId: string) {
    return this.goals.findByCompany(companyId);
  }

  @Get('goals/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.goals.findOne(id);
  }

  @Post('goals/:id/start')
  start(@Param('id', ParseUUIDPipe) id: string) {
    return this.goals.start(id);
  }
}
