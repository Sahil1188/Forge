import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ObservabilityService } from './observability.service';

@Controller()
export class ObservabilityController {
  constructor(private readonly observability: ObservabilityService) {}

  @Get('companies/:id/overview')
  overview(@Param('id', ParseUUIDPipe) id: string) {
    return this.observability.companyOverview(id);
  }

  @Get('work-items/:id/runs')
  workItemRuns(@Param('id', ParseUUIDPipe) id: string) {
    return this.observability.workItemRuns(id);
  }

  @Get('agent-runs/:id')
  run(@Param('id', ParseUUIDPipe) id: string) {
    return this.observability.run(id);
  }
}
