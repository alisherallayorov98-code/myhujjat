import {
  Controller, Post, Get, Body, Param, Query, Req, Headers, HttpCode,
} from '@nestjs/common'
import type { Request } from 'express'
import { DidoxService } from './didox.service'
import { Public }       from '../../common/decorators/public.decorator'
import { CurrentUser }  from '../../common/decorators/current-user.decorator'
import { TenantAccessService } from '../../common/services/tenant-access.service'

@Controller('didox')
export class DidoxController {
  constructor(
    private readonly didoxService: DidoxService,
    private readonly tenant:       TenantAccessService,
  ) {}

  @Post('send/:contractId')
  async sendInvoice(
    @CurrentUser() user: any,
    @Query('orgId')      orgId:      string,
    @Param('contractId') contractId: string,
    @Body('specId')      specId:     string,
  ) {
    // Org va contract ownership ikkalasi ham tekshirilishi kerak
    await this.tenant.requireOrgAccess(user.sub, orgId)
    await this.tenant.requireResourceOwnership(user.sub, 'contract', contractId)
    return this.didoxService.sendInvoice(orgId, contractId, specId)
  }

  @Get('status/:didoxId')
  checkStatus(@Param('didoxId') didoxId: string) {
    // Status tekshirish — Didox ID public/opaque, ownership tekshirish kerak emas
    // (foydalanuvchi bilmagan didoxId ni topa olmaydi)
    return this.didoxService.checkStatus(didoxId)
  }

  // ─── Didox webhook (push-events from Didox) ──────────────
  @Public()
  @Post('webhook')
  @HttpCode(200)
  webhook(
    @Req()                                req:       Request,
    @Headers('x-didox-signature')         signature: string,
    @Body()                               body:      any,
  ) {
    const rawBody = (req as any).rawBody as Buffer | undefined
    return this.didoxService.handleWebhook(rawBody, signature, body)
  }
}
