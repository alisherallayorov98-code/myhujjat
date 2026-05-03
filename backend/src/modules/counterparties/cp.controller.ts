import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common'
import { CounterpartiesService, CreateCpDto } from './cp.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { TenantAccessService } from '../../common/services/tenant-access.service'

@Controller('counterparties')
export class CounterpartiesController {
  constructor(
    private readonly cpService: CounterpartiesService,
    private readonly tenant:    TenantAccessService,
  ) {}

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('orgId')  orgId:   string,
    @Query('page')   page?:   string,
    @Query('limit')  limit?:  string,
    @Query('search') search?: string,
  ) {
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.cpService.findAll(orgId, {
      page:   page  ? Number(page)  : 1,
      limit:  limit ? Number(limit) : 20,
      search,
    })
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    await this.tenant.requireResourceOwnership(user.sub, 'counterparty', id)
    return this.cpService.findOne(id)
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() dto: CreateCpDto) {
    await this.tenant.requireOrgAccess(user.sub, dto.organizationId)
    return this.cpService.create(dto)
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: Partial<CreateCpDto>,
  ) {
    await this.tenant.requireResourceOwnership(user.sub, 'counterparty', id)
    return this.cpService.update(id, dto)
  }

  @Put(':id/stir-status')
  async updateStirStatus(
    @CurrentUser() user: any,
    @Param('id')   id: string,
    @Body('status') status: string,
  ) {
    await this.tenant.requireResourceOwnership(user.sub, 'counterparty', id)
    return this.cpService.updateStirStatus(id, status)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    await this.tenant.requireResourceOwnership(user.sub, 'counterparty', id)
    return this.cpService.remove(id)
  }
}
