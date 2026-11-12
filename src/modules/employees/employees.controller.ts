import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import {
  CreateEmployeeDto,
  EmployeeBriefDto,
  SetSkillsDto,
  UpdateEmployeeDto,
} from './dto/create-employee.dto';

@Controller()
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Post('companies/:companyId/employees')
  create(@Param('companyId', ParseUUIDPipe) companyId: string, @Body() dto: CreateEmployeeDto) {
    return this.employees.create(companyId, dto);
  }

  @Get('companies/:companyId/employees')
  findByCompany(@Param('companyId', ParseUUIDPipe) companyId: string) {
    return this.employees.findByCompany(companyId);
  }

  @Get('employees/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.employees.findOne(id);
  }

  @Patch('employees/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employees.update(id, dto);
  }

  @Put('employees/:id/skills')
  setSkills(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SetSkillsDto) {
    return this.employees.setSkills(id, dto.skills);
  }

  @Get('employees/:id/brief')
  getBrief(@Param('id', ParseUUIDPipe) id: string) {
    return this.employees.getBrief(id);
  }

  @Put('employees/:id/brief')
  setBrief(@Param('id', ParseUUIDPipe) id: string, @Body() dto: EmployeeBriefDto) {
    return this.employees.setBrief(id, dto);
  }

  @Delete('employees/:id/brief')
  resetBrief(@Param('id', ParseUUIDPipe) id: string) {
    return this.employees.resetBrief(id);
  }

  @Delete('employees/:id')
  @HttpCode(204)
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.employees.deactivate(id);
  }
}
