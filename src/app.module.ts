import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { EventsModule } from './infrastructure/events/events.module';
import { HealthModule } from './modules/health/health.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { GoalsModule } from './modules/goals/goals.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { WorkModule } from './modules/work/work.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { RuntimesModule } from './modules/runtimes/runtimes.module';
import { GovernanceModule } from './modules/governance/governance.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { EvaluationModule } from './modules/evaluation/evaluation.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { MemoryModule } from './modules/memory/memory.module';
import { RoutingModule } from './modules/routing/routing.module';
import { HeartbeatsModule } from './modules/heartbeats/heartbeats.module';
import { ObservabilityModule } from './modules/observability/observability.module';
import { WorkersModule } from './workers/workers.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    EventsModule,
    HealthModule,
    CompaniesModule,
    EmployeesModule,
    GoalsModule,
    ProjectsModule,
    WorkModule,
    WorkspacesModule,
    RuntimesModule,
    GovernanceModule,
    ApprovalsModule,
    BudgetsModule,
    EvaluationModule,
    PerformanceModule,
    MemoryModule,
    RoutingModule,
    HeartbeatsModule,
    ObservabilityModule,
    WorkersModule,
  ],
})
export class AppModule {}
