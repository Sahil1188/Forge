import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';

@Controller()
export class GoalsController {
  constructor(private readonly goals: GoalsService) {}

  @Post('companies/:companyId/goals')
  async create(@Param('companyId', ParseUUIDPipe) companyId: string, @Body() dto: CreateGoalDto) {
    const goal = await this.goals.create(companyId, dto);
    // `start: true` = create and kick off in one call (the console's "Run" button).
    return dto.start ? this.goals.start(goal.id) : goal;
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
