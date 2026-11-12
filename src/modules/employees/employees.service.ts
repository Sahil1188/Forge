import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray, isNull } from 'drizzle-orm';
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
import { CreateEmployeeDto, EmployeeSkillDto, UpdateEmployeeDto } from './dto/create-employee.dto';
import { workItems } from '../work/work.schema';
import { BriefContent, EmployeeBrief, briefForEmployee, defaultBriefFor } from './employee-briefs';

@Injectable()
export class EmployeesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly companies: CompaniesService,
  ) {}

  async create(companyId: string, dto: CreateEmployeeDto): Promise<EmployeeWithRelations> {
    // Guarantees the company exists (throws 404 otherwise).
    await this.companies.findOne(companyId);
    if (dto.skills?.length) assertUniqueSkills(dto.skills);

    // The reporting line must stay inside one tenant: the manager has to exist and
    // belong to this company (otherwise: a 500 FK error, or a cross-tenant org chart).
    if (dto.managerEmployeeId) {
      const [manager] = await this.db
        .select({ companyId: employees.companyId })
        .from(employees)
        .where(and(eq(employees.id, dto.managerEmployeeId), isNull(employees.deletedAt)));
      if (!manager || manager.companyId !== companyId) {
        throw new BadRequestException(
          `Manager ${dto.managerEmployeeId} does not exist in company ${companyId}`,
        );
      }
    }

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
        governance: (dto.governance ?? {}) as Record<string, unknown>,
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

  /** Partial update of an employee's profile, reporting line, runtime config and governance. */
  async update(id: string, dto: UpdateEmployeeDto): Promise<EmployeeWithRelations> {
    const current = await this.findOne(id);

    if (dto.managerEmployeeId !== undefined && dto.managerEmployeeId !== null) {
      await this.assertValidManager(current, dto.managerEmployeeId);
    }

    let runtimeConfigId = current.runtimeConfigId;
    if (dto.runtimeConfig) {
      const rc = dto.runtimeConfig;
      if (current.runtimeConfig) {
        await this.db
          .update(employeeRuntimeConfigs)
          .set({
            ...(rc.runtimeKey !== undefined ? { runtimeKey: rc.runtimeKey } : {}),
            ...(rc.provider !== undefined ? { provider: rc.provider } : {}),
            ...(rc.modelPolicy !== undefined ? { modelPolicy: rc.modelPolicy as ModelPolicy } : {}),
            ...(rc.settings !== undefined ? { settings: rc.settings } : {}),
          })
          .where(eq(employeeRuntimeConfigs.id, current.runtimeConfig.id));
      } else {
        const [created] = await this.db
          .insert(employeeRuntimeConfigs)
          .values({
            runtimeKey: rc.runtimeKey ?? 'claude_code',
            provider: rc.provider ?? 'anthropic',
            modelPolicy: (rc.modelPolicy ?? {}) as ModelPolicy,
            settings: rc.settings ?? {},
          })
          .returning();
        runtimeConfigId = created.id;
      }
    }

    await this.db
      .update(employees)
      .set({
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.role !== undefined ? { role: dto.role } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.department !== undefined ? { department: dto.department } : {}),
        ...(dto.managerEmployeeId !== undefined
          ? { managerEmployeeId: dto.managerEmployeeId }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.governance !== undefined
          ? { governance: dto.governance as Record<string, unknown> }
          : {}),
        runtimeConfigId,
      })
      .where(eq(employees.id, id));
    return this.findOne(id);
  }

  /** Replaces the employee's skill set (manual edits; evaluation-driven growth continues on top). */
  async setSkills(id: string, skills: EmployeeSkillDto[]): Promise<EmployeeWithRelations> {
    await this.findOne(id);
    assertUniqueSkills(skills);
    await this.db.transaction(async (tx) => {
      await tx.delete(employeeSkills).where(eq(employeeSkills.employeeId, id));
      if (skills.length > 0) {
        await tx.insert(employeeSkills).values(
          skills.map((k) => ({
            employeeId: id,
            skillKey: k.skillKey,
            level: k.level,
            source: 'manual',
          })),
        );
      }
    });
    return this.findOne(id);
  }

  /**
   * Removes an employee from the company (soft delete, history is kept). Refused while they
   * still hold active work or have direct reports — reassign those first.
   */
  async deactivate(id: string): Promise<void> {
    await this.findOne(id);
    const active = await this.db
      .select({ id: workItems.id })
      .from(workItems)
      .where(
        and(
          eq(workItems.assignedEmployeeId, id),
          inArray(workItems.status, ['assigned', 'in_progress', 'needs_approval', 'evaluating']),
        ),
      );
    if (active.length > 0) {
      throw new ConflictException(
        `Employee ${id} still has ${active.length} active work item(s); reassign or finish them first`,
      );
    }
    const reports = await this.db
      .select({ id: employees.id })
      .from(employees)
      .where(and(eq(employees.managerEmployeeId, id), isNull(employees.deletedAt)));
    if (reports.length > 0) {
      throw new ConflictException(
        `Employee ${id} still manages ${reports.length} employee(s); move them first`,
      );
    }
    await this.db.update(employees).set({ deletedAt: new Date() }).where(eq(employees.id, id));
  }

  /** Manager must exist in the same company and must not create a cycle in the org chart. */
  private async assertValidManager(employee: Employee, managerId: string): Promise<void> {
    if (managerId === employee.id) {
      throw new BadRequestException('An employee cannot manage themselves');
    }
    let cursor: string | null = managerId;
    const seen = new Set<string>();
    while (cursor) {
      if (cursor === employee.id) {
        throw new BadRequestException('That reporting line would create a cycle in the org chart');
      }
      if (seen.has(cursor)) break;
      seen.add(cursor);
      const [row] = await this.db
        .select({ companyId: employees.companyId, managerEmployeeId: employees.managerEmployeeId })
        .from(employees)
        .where(and(eq(employees.id, cursor), isNull(employees.deletedAt)));
      if (!row || row.companyId !== employee.companyId) {
        throw new BadRequestException(
          `Manager ${managerId} does not exist in company ${employee.companyId}`,
        );
      }
      cursor = row.managerEmployeeId;
    }
  }

  async findByCompany(companyId: string): Promise<Employee[]> {
    return this.db
      .select()
      .from(employees)
      .where(and(eq(employees.companyId, companyId), isNull(employees.deletedAt)));
  }

  /** The brief this employee works under, whether it was edited, and the built-in one to compare or reset to. */
  async getBrief(
    id: string,
  ): Promise<{ brief: EmployeeBrief | null; custom: boolean; builtIn: EmployeeBrief | null }> {
    const employee = await this.findOne(id);
    return {
      brief: briefForEmployee(employee),
      custom: Boolean(employee.brief),
      builtIn: defaultBriefFor(employee),
    };
  }

  /** Saves an edited brief; it is used from the employee's next task on. */
  async setBrief(
    id: string,
    brief: BriefContent,
  ): Promise<{ brief: EmployeeBrief | null; custom: boolean; builtIn: EmployeeBrief | null }> {
    await this.findOne(id);
    const clean = (lines: string[]) => lines.map((l) => l.trim()).filter(Boolean);
    const content: BriefContent = {
      mission: brief.mission.trim(),
      standards: clean(brief.standards),
      workflow: clean(brief.workflow),
      definitionOfDone: clean(brief.definitionOfDone),
      never: clean(brief.never),
      escalateWhen: clean(brief.escalateWhen),
      deliverable: brief.deliverable.trim(),
    };
    await this.db.update(employees).set({ brief: content }).where(eq(employees.id, id));
    return this.getBrief(id);
  }

  /** Drops the edited brief, so the built-in one applies again. */
  async resetBrief(
    id: string,
  ): Promise<{ brief: EmployeeBrief | null; custom: boolean; builtIn: EmployeeBrief | null }> {
    await this.findOne(id);
    await this.db.update(employees).set({ brief: null }).where(eq(employees.id, id));
    return this.getBrief(id);
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

function assertUniqueSkills(skills: EmployeeSkillDto[]): void {
  const keys = skills.map((k) => k.skillKey.toLowerCase());
  if (new Set(keys).size !== keys.length) {
    throw new BadRequestException('Each skill may only be listed once');
  }
}
