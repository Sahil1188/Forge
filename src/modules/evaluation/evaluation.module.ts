import { Module } from '@nestjs/common';
import { WorkModule } from '../work/work.module';
import { RuntimesModule } from '../runtimes/runtimes.module';
import { PerformanceModule } from '../performance/performance.module';
import { MemoryModule } from '../memory/memory.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ScriptDiscovery } from './script-discovery';
import { CommandRunner } from './command-runner';
import { EvaluationEngine } from './evaluation-engine';
import { EvaluationsService } from './evaluations.service';
import { EvaluationWorker } from './evaluation.worker';
import { EvaluationController } from './evaluation.controller';

@Module({
  imports: [WorkModule, RuntimesModule, PerformanceModule, MemoryModule, WorkspacesModule],
  controllers: [EvaluationController],
  providers: [
    ScriptDiscovery,
    CommandRunner,
    EvaluationEngine,
    EvaluationsService,
    EvaluationWorker,
  ],
  exports: [EvaluationWorker, EvaluationsService, EvaluationEngine],
})
export class EvaluationModule {}
