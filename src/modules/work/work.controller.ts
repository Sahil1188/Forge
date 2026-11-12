import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { WorkService } from './work.service';
import {
  AddDependencyDto,
  AssignWorkDto,
  ChangeStatusDto,
  CreateWorkItemDto,
} from './dto/work.dto';

@Controller()
export class WorkController {
  constructor(private readonly work: WorkService) {}

  @Post('projects/:projectId/work-items')
  create(@Param('projectId', ParseUUIDPipe) projectId: string, @Body() dto: CreateWorkItemDto) {
    return this.work.createWorkItem(projectId, dto);
  }

  @Get('projects/:projectId/work-items')
  findByProject(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.work.findByProject(projectId);
  }

  @Get('work-items/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.work.findOne(id);
  }

  @Post('work-items/:id/assign')
  assign(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignWorkDto) {
    return this.work.assign(id, dto);
  }

  @Post('work-items/:id/status')
  changeStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ChangeStatusDto) {
    return this.work.changeStatus(id, dto);
  }

  @Post('work-items/:id/dependencies')
  addDependency(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddDependencyDto) {
    return this.work.addDependency(id, dto);
  }
}
