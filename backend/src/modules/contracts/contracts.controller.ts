import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, HttpCode, HttpStatus, UseGuards, BadRequestException,
} from '@nestjs/common'
import { ContractsService, CreateContractDto } from './contracts.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { TenantRateLimitGuard, TenantLimit } from '../../common/guards/tenant-rate-limit.guard'
import { TenantAccessService } from '../../common/services/tenant-access.service'

@Controller('contracts')
@UseGuards(TenantRateLimitGuard)
export class ContractsController {
  constructor(
    private readonly contractsService: ContractsService,
    private readonly tenant:           TenantAccessService,
  ) {}

  @Get('stats/:orgId')
  async getStats(@CurrentUser() user: any, @Param('orgId') orgId: string) {
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.contractsService.getStats(orgId)
  }

  @Get()
  async findAll(@CurrentUser() user: any, @Query() query: any) {
    await this.tenant.requireOrgAccess(user.sub, query.orgId)
    const page         = query.page  ? parseInt(query.page)  : 1
    const limit        = query.limit ? parseInt(query.limit) : 20
    const expiringSoon = query.expiringSoon === 'true'
    return this.contractsService.findAll(query.orgId, { ...query, page, limit, expiringSoon })
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('id')    id:    string,
  ) {
    await this.tenant.requireResourceOwnership(user.sub, 'contract', id)
    return this.contractsService.findOne(orgId, id)
  }

  @Post()
  @TenantLimit({ limit: 30, windowMs: 60_000 })  // 1 daqiqada max 30 ta shartnoma yaratish
  async create(@CurrentUser() user: any, @Body() dto: CreateContractDto) {
    await this.tenant.requireOrgAccess(user.sub, dto.organizationId)
    return this.contractsService.create(user.sub, dto)
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('id')    id:    string,
    @Body()         dto:   Partial<CreateContractDto>,
  ) {
    await this.tenant.requireResourceOwnership(user.sub, 'contract', id)
    return this.contractsService.update(orgId, id, dto)
  }

  @Put(':id/status')
  async updateStatus(
    @CurrentUser() user: any,
    @Query('orgId') orgId:  string,
    @Param('id')    id:     string,
    @Body('status') status: string,
  ) {
    await this.tenant.requireResourceOwnership(user.sub, 'contract', id)
    return this.contractsService.updateStatus(orgId, id, status)
  }

  @Patch(':id/pin')
  async togglePin(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('id')    id:    string,
  ) {
    await this.tenant.requireResourceOwnership(user.sub, 'contract', id)
    return this.contractsService.togglePin(orgId, id)
  }

  @Get(':id/timeline')
  async getTimeline(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('id')    id:    string,
  ) {
    await this.tenant.requireResourceOwnership(user.sub, 'contract', id)
    return this.contractsService.getTimeline(orgId, id)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('id')    id:    string,
  ) {
    await this.tenant.requireResourceOwnership(user.sub, 'contract', id)
    return this.contractsService.remove(orgId, id)
  }

  // Bulk delete — multi-tenant guard ichkarida
  @Post('bulk-delete')
  async bulkDelete(
    @CurrentUser() user: any,
    @Body() body: { orgId: string; ids: string[] },
  ) {
    if (!body?.orgId || !Array.isArray(body?.ids)) {
      throw new BadRequestException('orgId va ids kerak')
    }
    await this.tenant.requireOrgAccess(user.sub, body.orgId)
    return this.contractsService.bulkDelete(body.orgId, body.ids)
  }
}
