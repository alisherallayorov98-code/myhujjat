import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags }                                  from '@nestjs/swagger'
import { FoundersService }                                         from './founders.service'
import { CurrentUser }                                             from '../../common/decorators/current-user.decorator'
import { TenantAccessService }                                     from '../../common/services/tenant-access.service'

@ApiTags('Founders')
@ApiBearerAuth()
@Controller('founders')
export class FoundersController {
  constructor(
    private readonly foundersService: FoundersService,
    private readonly tenant:          TenantAccessService,
  ) {}

  @Get()
  async findAll(@CurrentUser() user: any, @Query('orgId') orgId: string) {
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.foundersService.findAll(orgId)
  }

  @Post()
  async create(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Body() dto: any,
  ) {
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.foundersService.create(orgId, dto)
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    await this.tenant.requireResourceOwnership(user.sub, 'tasischi', id)
    return this.foundersService.update(id, dto)
  }

  @Delete(':id')
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    await this.tenant.requireResourceOwnership(user.sub, 'tasischi', id)
    return this.foundersService.remove(id)
  }
}
