import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query,
} from '@nestjs/common'
import { DocumentsService, CreateDocDto, UpdateDocDto } from './documents.service'
import { DocumentType } from '@prisma/client'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { TenantAccessService } from '../../common/services/tenant-access.service'

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly svc:    DocumentsService,
    private readonly tenant: TenantAccessService,
  ) {}

  // ── SEIF routes (must be before /:id) ───────────────────────────────────

  @Get('seif/stats')
  async getSeifStats(@CurrentUser() user: any, @Query('orgId') orgId: string) {
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.svc.getSeifStats(orgId)
  }

  @Get('seif')
  async findSeif(@CurrentUser() user: any, @Query() query: any) {
    await this.tenant.requireOrgAccess(user.sub, query.orgId)
    return this.svc.findSeif(query.orgId, {
      search: query.search,
      type:   query.type,
      page:   query.page  ? parseInt(query.page)  : 1,
      limit:  query.limit ? parseInt(query.limit) : 30,
    })
  }

  // ── CRUD routes ──────────────────────────────────────────────────────────

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('orgId')      orgId:       string,
    @Query('type')       type?:       DocumentType,
    @Query('page')       page?:       string,
    @Query('limit')      limit?:      string,
    @Query('employeeId') employeeId?: string,
  ) {
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.svc.findAll(orgId, {
      type,
      page:  page  ? Number(page)  : 1,
      limit: limit ? Number(limit) : 30,
      employeeId,
    })
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('id')    id: string,
  ) {
    await this.tenant.requireResourceOwnership(user.sub, 'document', id)
    return this.svc.findOne(orgId, id)
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() dto: CreateDocDto) {
    await this.tenant.requireOrgAccess(user.sub, dto.organizationId)
    return this.svc.create(dto)
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('id')    id: string,
    @Body()         dto: UpdateDocDto,
  ) {
    await this.tenant.requireResourceOwnership(user.sub, 'document', id)
    return this.svc.update(orgId, id, dto)
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('id')    id: string,
  ) {
    await this.tenant.requireResourceOwnership(user.sub, 'document', id)
    return this.svc.remove(orgId, id)
  }
}
