import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { EmployeesModule } from '../employees/employees.module';
import { RuntimesModule } from '../runtimes/runtimes.module';
import { ObservabilityService } from './observability.service';
import { ObservabilityController } from './observability.controller';
import { UiController } from './ui.controller';

@Module({
  imports: [CompaniesModule, EmployeesModule, RuntimesModule],
  controllers: [ObservabilityController, UiController],
  providers: [ObservabilityService],
  exports: [ObservabilityService],
})
export class ObservabilityModule {}
