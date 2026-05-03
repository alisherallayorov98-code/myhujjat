import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  BadRequestException,
} from '@nestjs/common'
import { BulkSendService, type UpdateDraftDto } from './bulk-send.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { PrismaService } from '../prisma/prisma.service'

@Controller('bulk-send')
export class BulkSendController {
  constructor(
    private readonly service: BulkSendService,
    private readonly prisma:  PrismaService,
  ) {}

  // ─── Mavjud draft (yoki yangi) ─────────────────────────────
  @Get('draft')
  async getDraft(@CurrentUser() user: any) {
    const orgId = await this.resolveOrgId(user.sub)
    return this.service.getOrCreateDraft(user.sub, orgId)
  }

  @Get('draft/:id')
  async getById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.getDraft(user.sub, id)
  }

  @Patch('draft/:id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateDraftDto,
  ) {
    return this.service.updateDraft(user.sub, id, dto)
  }

  @Delete('draft/:id')
  async deleteDraft(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.deleteDraft(user.sub, id)
  }

  // ─── O'tgan yil hamkorlari (smart filter) ──────────────────
  @Get('last-year-counterparties')
  async lastYear(@CurrentUser() user: any) {
    const orgId = await this.resolveOrgId(user.sub)
    return this.service.getLastYearCounterparties(user.sub, orgId)
  }

  // ─── Bajarish (ommaviy yaratish) ───────────────────────────
  @Post('draft/:id/execute')
  async execute(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.execute(user.sub, id)
  }

  // ─── Statusni yangilash (imzolash, yuborish) ───────────────
  @Post('draft/:id/mark-signed')
  async markSigned(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('contractId') contractId: string,
  ) {
    if (!contractId) throw new BadRequestException('contractId kerak')
    return this.service.markItemSigned(user.sub, id, contractId)
  }

  @Post('draft/:id/mark-sent')
  async markSent(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('contractId') contractId: string,
  ) {
    if (!contractId) throw new BadRequestException('contractId kerak')
    return this.service.markItemSent(user.sub, id, contractId)
  }

  // ─── Helper ────────────────────────────────────────────────
  private async resolveOrgId(userId: string): Promise<string> {
    const def = await this.prisma.organization.findFirst({
      where: { userId, isDefault: true },
    })
    const any = def || await this.prisma.organization.findFirst({
      where: { userId },
    })
    if (!any) throw new BadRequestException("Avval tashkilot qo'shing")
    return any.id
  }
}
