import {
  Controller, Get, Post, Body, Query, Req,
  UnauthorizedException,
} from '@nestjs/common'
import { Request } from 'express'
import { AcknowledgementsService } from './acknowledgements.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { getDisclaimer } from './disclaimer.constants'

@Controller('acknowledgements')
export class AcknowledgementsController {
  constructor(private readonly svc: AcknowledgementsService) {}

  // Joriy disclaimer matnini olish (modal'da ko'rsatish uchun)
  @Get('disclaimer')
  getDisclaimerText(@Query('locale') locale?: string) {
    const lang = (locale === 'ru' || locale === 'oz' || locale === 'uz') ? locale : 'uz'
    return getDisclaimer(lang)
  }

  // Foydalanuvchi shablonni qabul qiladi (yozma rozilik DB'ga yoziladi)
  @Post()
  async accept(
    @CurrentUser() user: any,
    @Req() req: Request,
    @Body() body: { templateRef: string },
  ) {
    if (!user?.sub) throw new UnauthorizedException()

    // IP — proxy orqali kelishi mumkin (Caddy/Nginx X-Forwarded-For)
    const ipFromHeader = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
    const ipAddress    = ipFromHeader || req.ip || req.socket?.remoteAddress || undefined
    const userAgent    = req.headers['user-agent'] as string | undefined

    return this.svc.accept({
      userId:      user.sub,
      templateRef: body.templateRef,
      ipAddress,
      userAgent,
    })
  }

  // Tekshirish: foydalanuvchi shu shablon uchun joriy versiyani qabul qilganmi?
  @Get('check')
  async check(
    @CurrentUser() user: any,
    @Query('templateRef') templateRef: string,
  ) {
    if (!user?.sub) throw new UnauthorizedException()
    return this.svc.check(user.sub, templateRef)
  }

  // Foydalanuvchining barcha tasdiqlari (profil/audit)
  @Get('mine')
  async mine(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
  ) {
    if (!user?.sub) throw new UnauthorizedException()
    return this.svc.listForUser(user.sub, limit ? Number(limit) : 50)
  }
}
