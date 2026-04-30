import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common'
import { EmployeesService, CreateEmployeeDto } from './employees.service'

@Controller('employees')
export class EmployeesController {
  constructor(private readonly svc: EmployeesService) {}

  @Get('stats')
  getStats(@Query('orgId') orgId: string) {
    return this.svc.getStats(orgId)
  }

  @Get()
  findAll(
    @Query('orgId')  orgId: string,
    @Query('search') search?: string,
  ) {
    return this.svc.findAll(orgId, search)
  }

  @Post()
  create(@Body() dto: CreateEmployeeDto) {
    return this.svc.create(dto)
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body()      dto: Partial<CreateEmployeeDto>,
  ) {
    return this.svc.update(id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.svc.remove(id)
  }
}
