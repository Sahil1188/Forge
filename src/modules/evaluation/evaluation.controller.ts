import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';

@Controller()
export class EvaluationController {
  constructor(private readonly evaluations: EvaluationsService) {}

  @Get('work-items/:workItemId/evaluations')
  findByWorkItem(@Param('workItemId', ParseUUIDPipe) workItemId: string) {
    return this.evaluations.findByWorkItem(workItemId);
  }

  @Get('evaluations/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.evaluations.findOne(id);
  }
}
