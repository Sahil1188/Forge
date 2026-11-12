import { getBrand } from '../brands/brand-library';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE, Database } from '../../infrastructure/database/drizzle.provider';
import { companies, Company } from './companies.schema';
import { folderProblem } from '../projects/project-location';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompaniesService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(dto: CreateCompanyDto): Promise<Company> {
    const [row] = await this.db
      .insert(companies)
      .values({
        name: dto.name,
        description: dto.description ?? null,
        ownerUserId: dto.ownerUserId ?? null,
      })
      .returning();
    return row;
  }

  async findAll(): Promise<Company[]> {
    return this.db.select().from(companies).where(isNull(companies.deletedAt));
  }

  async update(
    id: string,
    dto: {
      name?: string;
      description?: string | null;
      projectsDir?: string | null;
      brand?: string | null;
    },
  ): Promise<Company> {
    await this.findOne(id);
    const dir = dto.projectsDir === undefined ? undefined : dto.projectsDir?.trim() || null;
    const problem = dir ? folderProblem(dir, { mustBeEmpty: false }) : null;
    if (problem) throw new BadRequestException(`Projects folder: ${problem}`);
    if (dto.brand?.trim() && !(await getBrand(dto.brand.trim())))
      throw new BadRequestException(`Unknown brand "${dto.brand}". Pick one from the brand list.`);
    const [row] = await this.db
      .update(companies)
      .set({
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dir !== undefined ? { projectsDir: dir } : {}),
        ...(dto.brand !== undefined ? { brand: dto.brand?.trim() || null } : {}),
      })
      .where(eq(companies.id, id))
      .returning();
    return row;
  }

  async findOne(id: string): Promise<Company> {
    const [row] = await this.db
      .select()
      .from(companies)
      .where(and(eq(companies.id, id), isNull(companies.deletedAt)));
    if (!row) {
      throw new NotFoundException(`Company ${id} not found`);
    }
    return row;
  }
}
