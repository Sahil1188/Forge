import { Module } from '@nestjs/common';
import { GoalsModule } from '../goals/goals.module';
import { CompaniesModule } from '../companies/companies.module';
import { EmployeesModule } from '../employees/employees.module';
import { ProjectsModule } from '../projects/projects.module';
import { WorkModule } from '../work/work.module';
import { RuntimesModule } from '../runtimes/runtimes.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { RoutingModule } from '../routing/routing.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { CeoPlanner } from './ceo-planner.service';
import { HeartbeatWorker } from './heartbeat.worker';
import { HeartbeatsController } from './heartbeats.controller';

@Module({
  imports: [
    GoalsModule,
    CompaniesModule,
    EmployeesModule,
    ProjectsModule,
    WorkModule,
    RuntimesModule,
    WorkspacesModule,
    RoutingModule,
    BudgetsModule,
  ],
  controllers: [HeartbeatsController],
  providers: [CeoPlanner, HeartbeatWorker],
  exports: [CeoPlanner, HeartbeatWorker],
})
export class HeartbeatsModule {}
