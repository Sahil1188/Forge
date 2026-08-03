import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Controller()
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Post('goals/:goalId/projects')
  create(@Param('goalId', ParseUUIDPipe) goalId: string, @Body() dto: CreateProjectDto) {
    return this.projects.create(goalId, dto);
  }

  @Get('goals/:goalId/projects')
  findByGoal(@Param('goalId', ParseUUIDPipe) goalId: string) {
    return this.projects.findByGoal(goalId);
  }

  @Get('projects/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.projects.findOne(id);
  }
}
