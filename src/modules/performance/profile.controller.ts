import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { EmployeesService } from '../employees/employees.service';
import { PerformanceService } from './performance.service';
import { ReputationService } from './reputation.service';
import { SpecializationService } from './specialization.service';

/**
 * Aggregated employee capability profile (spec §14/§23): identity + skills +
 * computed reputation + inferred specialization + recent measured performance.
 */
@Controller('employees')
export class ProfileController {
  constructor(
    private readonly employees: EmployeesService,
    private readonly performance: PerformanceService,
    private readonly reputation: ReputationService,
    private readonly specialization: SpecializationService,
  ) {}

  @Get(':id/profile')
  async profile(@Param('id', ParseUUIDPipe) id: string) {
    const employee = await this.employees.findOne(id);
    const [reputation, specializations, recentPerformance] = await Promise.all([
      this.reputation.compute(id),
      this.specialization.infer(id),
      this.performance.findRecent(id),
    ]);
    return { employee, reputation, specializations, recentPerformance };
  }
}
