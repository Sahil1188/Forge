import {
  BadRequestException,
  Controller,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { WorkService } from '../work/work.service';
import { WORKFORCE_ROUTER, WorkforceRouterPort } from './workforce/workforce-router.port';

/**
 * Auto-assigns a work item to the best-fit employee via the Workforce Router
 * (the WHO decision), then creates the assignment.
 */
@Controller('work-items')
export class RoutingController {
  constructor(
    @Inject(WORKFORCE_ROUTER) private readonly router: WorkforceRouterPort,
    private readonly work: WorkService,
  ) {}

  @Post(':id/route')
  async route(@Param('id', ParseUUIDPipe) id: string) {
    const item = await this.work.findOne(id);
    const decision = await this.router.route({
      id: item.id,
      companyId: item.companyId,
      taskType: item.taskType,
    });
    if (!decision) {
      throw new BadRequestException('No candidate employees available to route to');
    }
    await this.work.assign(id, { employeeId: decision.employeeId, assignedBy: 'workforce_router' });
    return decision;
  }
}
