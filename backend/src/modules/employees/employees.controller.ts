import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common'
import { EmployeesService, CreateEmployeeDto, CreateLeaveDto } from './employees.service'
import { CurrentUser }         from '../../common/decorators/current-user.decorator'
import { TenantAccessService } from '../../common/services/tenant-access.service'

@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly svc:    EmployeesService,
    private readonly tenant: TenantAccessService,
  ) {}

  @Get('stats')
  async getStats(@CurrentUser() user: any, @Query('orgId') orgId: string) {
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.svc.getStats(orgId)
  }

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('orgId')  orgId:   string,
    @Query('search') search?: string,
    @Query('page')   page?:   string,
    @Query('limit')  limit?:  string,
    @Query('bolim')  bolim?:  string,
    @Query('status') status?: string,
  ) {
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.svc.findAll(orgId, {
      search,
      page:   page  ? Number(page)  : 1,
      limit:  limit ? Number(limit) : 20,
      bolim,
      status,
    })
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: any,
    @Param('id')   id:   string,
    @Query('orgId') orgId: string,
  ) {
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.svc.findOne(id, orgId)
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() dto: CreateEmployeeDto) {
    await this.tenant.requireOrgAccess(user.sub, dto.organizationId)
    return this.svc.create(dto)
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body()      dto: Partial<CreateEmployeeDto>,
  ) {
    await this.tenant.requireResourceOwnership(user.sub, 'employee', id)
    return this.svc.update(id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    await this.tenant.requireResourceOwnership(user.sub, 'employee', id)
    return this.svc.remove(id)
  }

  // ─── Ta'tillar ────────────────────────────────────────────────

  @Post(':id/leaves')
  async createLeave(
    @CurrentUser() user: any,
    @Param('id')   employeeId: string,
    @Query('orgId') orgId: string,
    @Body()        dto: CreateLeaveDto,
  ) {
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.svc.createLeave(employeeId, orgId, dto)
  }

  @Get(':id/leaves')
  async getLeaves(
    @CurrentUser() user: any,
    @Param('id')   employeeId: string,
    @Query('orgId') orgId: string,
    @Query('year')  year?: string,
  ) {
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.svc.getLeaves(employeeId, orgId, year ? Number(year) : undefined)
  }

  @Delete(':id/leaves/:leaveId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLeave(
    @CurrentUser() user: any,
    @Param('id')       employeeId: string,
    @Param('leaveId')  leaveId:    string,
    @Query('orgId')    orgId: string,
  ) {
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.svc.deleteLeave(employeeId, orgId, leaveId)
  }
}
