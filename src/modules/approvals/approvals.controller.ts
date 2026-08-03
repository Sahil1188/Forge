import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { DecideApprovalDto } from './dto/decide-approval.dto';

@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvals: ApprovalsService) {}

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.approvals.findOne(id);
  }

  @Post(':id/decision')
  decide(@Param('id', ParseUUIDPipe) id: string, @Body() dto: DecideApprovalDto) {
    return this.approvals.decide(id, dto.decision, dto.decidedByUserId);
  }
}
