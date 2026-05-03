import {
  Controller, Get, Post, Put,
  Delete, Body, Param, Query, HttpCode,
} from '@nestjs/common'
import { SpecService } from './spec.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { TenantAccessService } from '../../common/services/tenant-access.service'

@Controller('specifications')
export class SpecController {
  constructor(
    private readonly specService: SpecService,
    private readonly tenant:      TenantAccessService,
  ) {}

  @Get()
  async findAll(@CurrentUser() user: any, @Query('orgId') orgId: string) {
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.specService.findAll(orgId)
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    await this.tenant.requireResourceOwnership(user.sub, 'specification', id)
    return this.specService.findOne(orgId, id)
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() dto: any) {
    if (dto?.organizationId) {
      await this.tenant.requireOrgAccess(user.sub, dto.organizationId)
    }
    return this.specService.create(dto)
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('id')    id:    string,
    @Body()         dto:   any,
  ) {
    await this.tenant.requireResourceOwnership(user.sub, 'specification', id)
    return this.specService.update(orgId, id, dto)
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    await this.tenant.requireResourceOwnership(user.sub, 'specification', id)
    return this.specService.remove(orgId, id)
  }
}
