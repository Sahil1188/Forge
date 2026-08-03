import { Module } from '@nestjs/common';
import { EmployeesModule } from '../employees/employees.module';
import { WorkModule } from '../work/work.module';
import { PerformanceModule } from '../performance/performance.module';
import { WORKFORCE_ROUTER } from './workforce/workforce-router.port';
import { ScoringWorkforceRouter } from './workforce/scoring-workforce-router.service';
import { OMNI_ROUTER } from './omni/omni-router.port';
import { DynamicOmniRouter } from './omni/dynamic-omni-router.service';
import { RoutingController } from './routing.controller';

@Module({
  imports: [EmployeesModule, WorkModule, PerformanceModule],
  controllers: [RoutingController],
  providers: [
    { provide: WORKFORCE_ROUTER, useClass: ScoringWorkforceRouter },
    { provide: OMNI_ROUTER, useClass: DynamicOmniRouter },
  ],
  exports: [WORKFORCE_ROUTER, OMNI_ROUTER],
})
export class RoutingModule {}
