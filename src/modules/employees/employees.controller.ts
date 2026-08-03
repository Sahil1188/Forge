import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@Controller()
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Post('companies/:companyId/employees')
  create(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() dto: CreateEmployeeDto,
  ) {
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
}
