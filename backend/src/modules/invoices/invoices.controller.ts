import {
  Controller, Get, Post, Delete, Body, Param, Query,
  HttpCode, HttpStatus, BadRequestException,
} from '@nestjs/common'
import { InvoicesService } from './invoices.service'
import { DidoxService }    from './didox.service'
import { CurrentUser }     from '../../common/decorators/current-user.decorator'

@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly invoices: InvoicesService,
    private readonly didox:    DidoxService,
  ) {}

  // ─── Faktura ro'yxat ──────────────────────────────────────
  @Get()
  findAll(@CurrentUser() user: any, @Query() query: any) {
    if (!query.orgId) throw new BadRequestException('orgId kerak')
    return this.invoices.findAll(user.sub, query.orgId, query)
  }

  @Get('contract/:contractId')
  findByContract(@CurrentUser() user: any, @Param('contractId') contractId: string) {
    return this.invoices.findByContract(user.sub, contractId)
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.invoices.create(user.sub, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.invoices.remove(user.sub, id)
  }

  // ─── Excel import (har qator alohida obyekt) ─────────────
  @Post('import/excel')
  importExcel(@CurrentUser() user: any, @Body() body: { orgId: string; rows: any[] }) {
    if (!body.orgId)            throw new BadRequestException('orgId kerak')
    if (!Array.isArray(body.rows)) throw new BadRequestException('rows array kerak')
    return this.invoices.importFromExcel(user.sub, body.orgId, body.rows)
  }

  // ─── Didox sinxronlash ───────────────────────────────────
  @Post('sync/didox')
  syncDidox(@CurrentUser() user: any, @Body() body: { orgId: string; fromDate?: string; toDate?: string }) {
    if (!body.orgId) throw new BadRequestException('orgId kerak')
    return this.invoices.syncFromDidox(user.sub, body.orgId, body)
  }

  // ─── Qayta hisoblash (admin/manual) ──────────────────────
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
