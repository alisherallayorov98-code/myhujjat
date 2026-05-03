import {
  Controller, Get, Post, Delete, Body, Param, Query,
  HttpCode, HttpStatus, BadRequestException,
} from '@nestjs/common'
import { InvoicesService } from './invoices.service'
import { DidoxService }    from './didox.service'
import { CurrentUser }     from '../../common/decorators/current-user.decorator'
import { TenantAccessService } from '../../common/services/tenant-access.service'

@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly invoices: InvoicesService,
    private readonly didox:    DidoxService,
    private readonly tenant:   TenantAccessService,
  ) {}

  // ─── Faktura ro'yxat ──────────────────────────────────────
  @Get()
  async findAll(@CurrentUser() user: any, @Query() query: any) {
    if (!query.orgId) throw new BadRequestException('orgId kerak')
    await this.tenant.requireOrgAccess(user.sub, query.orgId)
    return this.invoices.findAll(user.sub, query.orgId, query)
  }

  @Get('contract/:contractId')
  async findByContract(@CurrentUser() user: any, @Param('contractId') contractId: string) {
    await this.tenant.requireResourceOwnership(user.sub, 'contract', contractId)
    return this.invoices.findByContract(user.sub, contractId)
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() dto: any) {
    if (dto?.organizationId) {
      await this.tenant.requireOrgAccess(user.sub, dto.organizationId)
    }
    return this.invoices.create(user.sub, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    await this.tenant.requireResourceOwnership(user.sub, 'invoice', id)
    return this.invoices.remove(user.sub, id)
  }

  // ─── Excel import (har qator alohida obyekt) ─────────────
  @Post('import/excel')
  async importExcel(@CurrentUser() user: any, @Body() body: { orgId: string; rows: any[] }) {
    if (!body.orgId)            throw new BadRequestException('orgId kerak')
    if (!Array.isArray(body.rows)) throw new BadRequestException('rows array kerak')
    await this.tenant.requireOrgAccess(user.sub, body.orgId)
    return this.invoices.importFromExcel(user.sub, body.orgId, body.rows)
  }

  // ─── Didox sinxronlash ───────────────────────────────────
  @Post('sync/didox')
  async syncDidox(@CurrentUser() user: any, @Body() body: { orgId: string; fromDate?: string; toDate?: string }) {
    if (!body.orgId) throw new BadRequestException('orgId kerak')
    await this.tenant.requireOrgAccess(user.sub, body.orgId)
    return this.invoices.syncFromDidox(user.sub, body.orgId, body)
  }

  // ─── Qayta hisoblash (admin/manual) ──────────────────────
  // Manual recalc — faqat admin uchun (lekin AdminGuard'siz). Foydalanuvchi
  // o'zining barcha tashkilotlari bo'yicha hisoblashga ruxsati bor.
  @Post('recalc')
  recalc(@CurrentUser() _user: any) {
    return this.invoices.recalcAll()
  }
}

@Controller('didox')
export class DidoxController {
  constructor(private readonly didox: DidoxService) {}

  @Get('status')
  status(@CurrentUser() user: any) {
    return this.didox.getStatus(user.sub)
  }

  @Post('connect')
  connect(@CurrentUser() user: any, @Body() dto: { apiKey: string; userKey: string }) {
    return this.didox.connectUser(user.sub, dto)
  }

  @Delete('disconnect')
  disconnect(@CurrentUser() user: any) {
    return this.didox.disconnectUser(user.sub)
  }
}
