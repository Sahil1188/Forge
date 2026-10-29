import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { EmployeesModule } from '../employees/employees.module';
import { GoalsModule } from '../goals/goals.module';
import { WorkModule } from '../work/work.module';
import { RuntimesModule } from '../runtimes/runtimes.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { RoutingModule } from '../routing/routing.module';
import { PerformanceModule } from '../performance/performance.module';
import { ConsoleController } from './console.controller';
import { ConsoleService } from './console.service';
import { AskService } from './ask.service';

@Module({
  imports: [CompaniesModule, EmployeesModule, GoalsModule, WorkModule, RuntimesModule, WorkspacesModule, RoutingModule, PerformanceModule],
  controllers: [ConsoleController],
  providers: [ConsoleService, AskService],
})
export class ConsoleModule {}
