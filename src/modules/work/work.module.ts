import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { EmployeesModule } from '../employees/employees.module';
import { WorkController } from './work.controller';
import { WorkService } from './work.service';

@Module({
  imports: [ProjectsModule, EmployeesModule],
  controllers: [WorkController],
  providers: [WorkService],
  exports: [WorkService],
})
export class WorkModule {}
