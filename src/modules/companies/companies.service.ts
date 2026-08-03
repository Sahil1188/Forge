import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE, Database } from '../../infrastructure/database/drizzle.provider';
import { companies, Company } from './companies.schema';
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
