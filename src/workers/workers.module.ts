import { Module } from '@nestjs/common';
import { RuntimesModule } from '../modules/runtimes/runtimes.module';
import { WorkspacesModule } from '../modules/workspaces/workspaces.module';
import { EmployeesModule } from '../modules/employees/employees.module';
import { WorkModule } from '../modules/work/work.module';
import { GovernanceModule } from '../modules/governance/governance.module';
import { ApprovalsModule } from '../modules/approvals/approvals.module';
import { BudgetsModule } from '../modules/budgets/budgets.module';
import { RoutingModule } from '../modules/routing/routing.module';
import { ExecutionWorker } from './execution.worker';
import { ApprovalDecisionListener } from './approval-decision.listener';

@Module({
  imports: [
    RuntimesModule,
    WorkspacesModule,
    EmployeesModule,
    WorkModule,
    GovernanceModule,
    ApprovalsModule,
    BudgetsModule,
    RoutingModule,
  ],
  providers: [ExecutionWorker, ApprovalDecisionListener],
  exports: [ExecutionWorker],
})
export class WorkersModule {}
