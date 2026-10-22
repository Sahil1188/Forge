import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/create-company.dto';
import { AuthService } from '../auth/auth.service';
import { ForgeRequest } from '../auth/access.guard';

@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companies: CompaniesService,
    private readonly auth: AuthService,
  ) {}

  /** Whoever creates a company owns it. */
  @Post()
  async create(@Body() dto: CreateCompanyDto, @Req() req: ForgeRequest) {
    const company = await this.companies.create(dto);
    const user = req.forge?.user;
    if (user) await this.auth.grant(company.id, user.id, 'owner');
    return company;
  }

  /** With accounts on, people see only the companies they belong to. */
  @Get()
  async findAll(@Req() req: ForgeRequest) {
    const all = await this.companies.findAll();
    const user = req.forge?.user;
    if (!user) return all;
    const mine = new Set((await this.auth.companiesOf(user.id)).map((m) => m.companyId));
    return all.filter((c) => mine.has(c.id));
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.companies.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCompanyDto) {
    return this.companies.update(id, dto);
  }
}
