import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query,
} from '@nestjs/common'
import { TemplatesService, CreateTemplateDto, UpdateTemplateDto } from './templates.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { TenantAccessService } from '../../common/services/tenant-access.service'

@Controller('templates')
export class TemplatesController {
  constructor(
    private readonly svc:    TemplatesService,
    private readonly tenant: TenantAccessService,
  ) {}

  @Get('seed')
  seed() {
    return this.svc.seedSystemTemplates()
  }

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('orgId')        orgId:        string,
    @Query('contractType') contractType?: string,
    @Query('search')       search?:      string,
    @Query('page')         page?:        string,
    @Query('limit')        limit?:       string,
  ) {
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.svc.findAll(orgId, {
      contractType,
      search,
      page:  page  ? Number(page)  : 1,
      limit: limit ? Number(limit) : 30,
    })
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    // System templates ham qabul qilinadi (requireResourceOwnership ichida tekshiriladi)
    await this.tenant.requireResourceOwnership(user.sub, 'template', id)
    return this.svc.findOne(id)
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() dto: CreateTemplateDto) {
    await this.tenant.requireOrgAccess(user.sub, dto.organizationId)
    return this.svc.create(dto)
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id')    id: string,
    @Query('orgId') orgId: string,
    @Body()         dto: UpdateTemplateDto,
  ) {
    await this.tenant.requireResourceOwnership(user.sub, 'template', id)
    return this.svc.update(id, orgId, dto)
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: any,
    @Param('id')    id: string,
    @Query('orgId') orgId: string,
  ) {
    await this.tenant.requireResourceOwnership(user.sub, 'template', id)
    return this.svc.remove(id, orgId)
  }
}
