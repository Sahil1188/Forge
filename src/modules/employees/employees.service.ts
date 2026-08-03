import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE, Database } from '../../infrastructure/database/drizzle.provider';
import { CompaniesService } from '../companies/companies.service';
import {
  employeeRuntimeConfigs,
  employees,
  employeeSkills,
  Employee,
  EmployeeWithRelations,
  ModelPolicy,
} from './employees.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly companies: CompaniesService,
  ) {}

  async create(companyId: string, dto: CreateEmployeeDto): Promise<EmployeeWithRelations> {
    // Guarantees the company exists (throws 404 otherwise).
    await this.companies.findOne(companyId);

    let runtimeConfigId: string | null = null;
    if (dto.runtimeConfig) {
      const [rc] = await this.db
        .insert(employeeRuntimeConfigs)
        .values({
          runtimeKey: dto.runtimeConfig.runtimeKey ?? 'claude_code',
          provider: dto.runtimeConfig.provider ?? 'anthropic',
          modelPolicy: (dto.runtimeConfig.modelPolicy ?? {}) as ModelPolicy,
          settings: dto.runtimeConfig.settings ?? {},
        })
        .returning();
      runtimeConfigId = rc.id;
    }

    const [emp] = await this.db
      .insert(employees)
      .values({
        companyId,
        name: dto.name,
        role: dto.role,
        description: dto.description ?? null,
        department: dto.department ?? null,
        managerEmployeeId: dto.managerEmployeeId ?? null,
        runtimeConfigId,
      })
      .returning();

    if (dto.skills?.length) {
      await this.db.insert(employeeSkills).values(
        dto.skills.map((s) => ({
          employeeId: emp.id,
          skillKey: s.skillKey,
          level: s.level,
          source: 'seed',
        })),
      );
    }

    return this.findOne(emp.id);
  }

  async findByCompany(companyId: string): Promise<Employee[]> {
    return this.db
      .select()
      .from(employees)
      .where(and(eq(employees.companyId, companyId), isNull(employees.deletedAt)));
  }

  async findOne(id: string): Promise<EmployeeWithRelations> {
    const [emp] = await this.db
      .select()
      .from(employees)
      .where(and(eq(employees.id, id), isNull(employees.deletedAt)));
    if (!emp) {
      throw new NotFoundException(`Employee ${id} not found`);
    }

    const skills = await this.db
      .select()
      .from(employeeSkills)
      .where(eq(employeeSkills.employeeId, id));

    let runtimeConfig: EmployeeWithRelations['runtimeConfig'] = null;
    if (emp.runtimeConfigId) {
      const [rc] = await this.db
        .select()
        .from(employeeRuntimeConfigs)
        .where(eq(employeeRuntimeConfigs.id, emp.runtimeConfigId));
      runtimeConfig = rc ?? null;
    }

    return { ...emp, skills, runtimeConfig };
  }
}
