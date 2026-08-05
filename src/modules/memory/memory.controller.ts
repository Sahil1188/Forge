import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { MemoryService } from './memory.service';

/** Read-side view of an employee's accumulated memory (spec §15/§25). */
@Controller('employees/:employeeId/memories')
export class MemoryController {
  constructor(private readonly memory: MemoryService) {}

  @Get()
  list(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Query('taskType') taskType?: string,
  ) {
    // With a taskType, return the ranked recall (what a run would actually see);
    // otherwise the full recent history.
    return taskType
      ? this.memory.recall(employeeId, { taskType, limit: 10 })
      : this.memory.findByEmployee(employeeId);
  }
}
