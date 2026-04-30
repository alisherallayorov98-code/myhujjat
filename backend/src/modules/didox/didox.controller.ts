import {
  Controller, Post, Get, Body, Param, Query, Req, Headers, HttpCode,
} from '@nestjs/common'
import type { Request } from 'express'
import { DidoxService } from './didox.service'
import { Public }       from '../../common/decorators/public.decorator'

@Controller('didox')
export class DidoxController {
  constructor(private readonly didoxService: DidoxService) {}

  @Post('send/:contractId')
  sendInvoice(
    @Query('orgId')      orgId:      string,
    @Param('contractId') contractId: string,
    @Body('specId')      specId:     string,
  ) {
    return this.didoxService.sendInvoice(orgId, contractId, specId)
  }

  @Get('status/:didoxId')
  checkStatus(@Param('didoxId') didoxId: string) {
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
