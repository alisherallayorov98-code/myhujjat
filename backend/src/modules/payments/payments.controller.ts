import {
  Controller, Get, Post, Body,
  Param, Query, Req, HttpCode,
} from '@nestjs/common'
import { Request }             from 'express'
import { ClickService }        from './click.service'
import { PaymeService }        from './payme.service'
import { SubscriptionService, PLANS, PlanKey } from '../subscriptions/subscription.service'
import { PrismaService }       from '../prisma/prisma.service'
import { CurrentUser }         from '../../common/decorators/current-user.decorator'
import { Public }              from '../../common/decorators/public.decorator'

@Controller('payments')
export class PaymentsController {
  constructor(
    private clickService: ClickService,
    private paymeService: PaymeService,
    private subService:   SubscriptionService,
    private prisma:       PrismaService,
  ) {}

  @Get('subscription')
  getSubscription(@CurrentUser() user: any) {
    return this.subService.getStats(user.sub)
  }

  @Get('url/:provider/:planKey')
  getPaymentUrl(
    @CurrentUser() user: any,
    @Param('provider') provider: string,
    @Param('planKey')  planKey:  string,
  ) {
    if (!PLANS[planKey as PlanKey]) return { error: "Noto'g'ri reja" }

    if (provider === 'click') {
      return { url: this.clickService.generatePaymentUrl(user.sub, planKey as PlanKey) }
    }
    if (provider === 'payme') {
      return { url: this.paymeService.generatePaymentUrl(user.sub, planKey as PlanKey) }
    }

    return { error: "Noto'g'ri provider" }
  }

  @Public()
  @Post('click')
  @HttpCode(200)
  async clickWebhook(@Body() body: any) {
    const action = parseInt(body.action)
    if (action === 0) return this.clickService.prepare(body)
    if (action === 1) return this.clickService.complete(body)
    return { error: -8, error_note: "Noto'g'ri action" }
  }

  @Public()
  @Post('payme')
  @HttpCode(200)
  async paymeWebhook(@Req() req: Request) {
    const auth = req.headers.authorization || ''
    if (!this.paymeService.verifyAuth(auth)) {
      return { jsonrpc: '2.0', id: null, error: { code: -32504, message: 'Unauthorized' } }
    }
    const { id, method, params } = req.body
    return this.paymeService.handle(id, method, params)
  }

  @Post('demo')
  activateDemo(@CurrentUser() user: any) {
    return this.subService.activateDemo(user.sub)
  }

  @Get('history')
  async getHistory(
    @CurrentUser() user: any,
    @Query('page')  page?:  string,
    @Query('limit') limit?: string,
  ) {
    const p = page  ? Math.max(1, Number(page))           : 1
    const l = limit ? Math.min(100, Math.max(1, Number(limit))) : 20

    const where = { userId: user.sub }

    const [total, data] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        skip:    (p - 1) * l,
        take:    l,
        orderBy: { createdAt: 'desc' },
        select: {
          id:        true,
          provider:  true,
          amount:    true,
          currency:  true,
          plan:      true,
          months:    true,
          status:    true,
          createdAt: true,
        },
      }),
    ])

    return { data, meta: { total, page: p, limit: l, totalPages: Math.ceil(total / l) } }
  }
}
