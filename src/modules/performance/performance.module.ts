import { Module } from '@nestjs/common';
import { EmployeesModule } from '../employees/employees.module';
import { PerformanceService } from './performance.service';
import { ReputationService } from './reputation.service';
import { SpecializationService } from './specialization.service';
import { SkillProgressionService } from './skill-progression.service';
import { ProfileController } from './profile.controller';

@Module({
  imports: [EmployeesModule],
  controllers: [ProfileController],
  providers: [
    PerformanceService,
    ReputationService,
    SpecializationService,
    SkillProgressionService,
  ],
  exports: [PerformanceService, ReputationService, SpecializationService, SkillProgressionService],
})
export class PerformanceModule {}
