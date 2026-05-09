import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common'
import { LegalService, CreateCaseDto, UpdateCaseDto, SaveDocumentDto } from './legal.service'
import { CurrentUser }         from '../../common/decorators/current-user.decorator'
import { TenantAccessService } from '../../common/services/tenant-access.service'

@Controller('legal')
export class LegalController {
  constructor(
    private readonly svc:    LegalService,
    private readonly tenant: TenantAccessService,
  ) {}

  // ── Special routes (must be before /:id) ──────────────────────────────────

  @Get('stats')
  async getStats(@CurrentUser() user: any, @Query('orgId') orgId: string) {
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.svc.getStats(orgId)
  }

  @Get('deadlines')
  async getDeadlines(@CurrentUser() user: any, @Query('orgId') orgId: string) {
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.svc.getDeadlines(orgId)
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('orgId')  orgId:   string,
    @Query('status') status?: string,
    @Query('type')   type?:   string,
    @Query('page')   page?:   string,
    @Query('limit')  limit?:  string,
  ) {
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.svc.findAll(orgId, {
      status,
      type,
      page:  page  ? Number(page)  : 1,
      limit: limit ? Number(limit) : 20,
    })
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('id')    id:    string,
  ) {
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.svc.findOne(orgId, id)
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() dto: CreateCaseDto) {
    await this.tenant.requireOrgAccess(user.sub, dto.organizationId)
    return this.svc.create(dto)
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('id')    id:    string,
    @Body()         dto:   UpdateCaseDto,
  ) {
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.svc.update(orgId, id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('id')    id:    string,
  ) {
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.svc.remove(orgId, id)
  }

  // ── Documents ─────────────────────────────────────────────────────────────

  @Post(':id/documents')
  async saveDocument(
    @CurrentUser() user: any,
    @Query('orgId') orgId:  string,
    @Param('id')    caseId: string,
    @Body()         dto:    SaveDocumentDto,
  ) {
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.svc.saveDocument(orgId, caseId, dto)
  }

  // ── Activity & Notes ──────────────────────────────────────────────────────

  @Get(':id/activity')
  async getActivity(
    @CurrentUser() user: any,
    @Query('orgId') orgId:  string,
    @Param('id')    caseId: string,
  ) {
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.svc.getActivity(orgId, caseId)
  }

  @Post(':id/notes')
  async addNote(
    @CurrentUser() user: any,
    @Query('orgId') orgId:  string,
    @Param('id')    caseId: string,
    @Body('note')   note:   string,
  ) {
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.svc.addNote(orgId, caseId, note)
  }
}
