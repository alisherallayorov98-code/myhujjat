import {
  Controller, Get, Post, Delete,
  Param, Query, Body, Req, HttpCode, HttpStatus,
} from '@nestjs/common'
import { Request } from 'express'
import { ShareLinksService } from './share-links.service'
import { CurrentUser }       from '../../common/decorators/current-user.decorator'
import { Public }            from '../../common/decorators/public.decorator'

@Controller('share-links')
export class ShareLinksController {
  constructor(private readonly service: ShareLinksService) {}

  // ─── PRIVATE: shartnoma uchun yangi havola yaratish ─────────
  @Post()
  create(
    @CurrentUser() user: any,
    @Body() body: {
      contractId:      string
      recipientEmail?: string
      recipientName?:  string
      recipientPhone?: string
      expiresInDays?:  number
    },
  ) {
    return this.service.create(user.sub, body.contractId, body)
  }

  // ─── PRIVATE: shartnoma uchun havolalar ro'yxati ────────────
  @Get('contract/:contractId')
  list(@CurrentUser() user: any, @Param('contractId') contractId: string) {
    return this.service.listForContract(user.sub, contractId)
  }

  // ─── PRIVATE: havolani bekor qilish ─────────────────────────
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  revoke(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.revoke(user.sub, id)
  }

  // ─── PUBLIC: token bo'yicha shartnomani ko'rish ─────────────
  @Public()
  @Get('public/:token')
  view(@Param('token') token: string, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip
    return this.service.getByToken(token, ip)
  }

  // ─── PUBLIC: token bo'yicha imzolash ────────────────────────
  @Public()
  @Post('public/:token/sign')
  sign(
    @Param('token') token: string,
    @Body() body: { signerName: string; signerEmail?: string },
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip
    return this.service.signByToken(token, { ...body, ip })
  }
}
