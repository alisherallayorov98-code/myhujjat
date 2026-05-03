import { Injectable, Logger } from '@nestjs/common'
import { PrismaService }       from '../prisma/prisma.service'
import { SubscriptionService, PLANS, PlanKey } from '../subscriptions/subscription.service'
import { createHash }          from 'crypto'

// Lazy env reading — har chaqiruvda yangi qiymat o'qiladi (test va prod uchun ham mos)
const env = (key: string, fallback = '') => process.env[key] || fallback

@Injectable()
export class ClickService {
  private readonly logger = new Logger(ClickService.name)

  constructor(
    private prisma:      PrismaService,
    private subService:  SubscriptionService,
  ) {}

  private verifySign(params: Record<string, any>, action: number): boolean {
    const hash = createHash('md5')
      .update(
        `${params.click_trans_id}${env('CLICK_SERVICE_ID')}${env('CLICK_SECRET_KEY')}` +
        `${params.merchant_trans_id}` +
        `${action === 1 ? (params.merchant_prepare_id || '') : ''}` +
        `${params.amount}${action}${params.sign_time}`
      )
      .digest('hex')
    return hash === params.sign_string
  }

  async prepare(params: {
    click_trans_id:    string
    service_id:        string
    merchant_trans_id: string
    amount:            number
    action:            number
    sign_time:         string
    sign_string:       string
  }) {
    this.logger.log(`Click PREPARE: ${params.merchant_trans_id}`)

    if (!this.verifySign(params, 0)) {
      return { error: -1, error_note: "Noto'g'ri imzo" }
    }

    const [userId, planKey] = params.merchant_trans_id.split(':')
    if (!userId || !planKey) {
      return { error: -5, error_note: "Noto'g'ri merchant_trans_id" }
    }

    const plan = PLANS[planKey as PlanKey]
    if (!plan) {
      return { error: -5, error_note: "Noto'g'ri reja" }
    }

    if (Math.abs(params.amount - plan.price) > 1) {
      return { error: -2, error_note: "Noto'g'ri summa" }
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return { error: -5, error_note: 'Foydalanuvchi topilmadi' }
    }

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        provider:   'CLICK',
        externalId: params.click_trans_id,
        amount:     plan.price,
        currency:   'UZS',
        plan:       planKey,
        months:     plan.months,
        status:     'PENDING',
        metadata:   params as any,
      },
    })

    return {
      click_trans_id:      params.click_trans_id,
      merchant_trans_id:   params.merchant_trans_id,
      merchant_prepare_id: payment.id,
      error:               0,
      error_note:          'Success',
    }
  }

  async complete(params: {
    click_trans_id:      string
    service_id:          string
    merchant_trans_id:   string
    merchant_prepare_id: string
    amount:              number
    action:              number
    error:               number
    sign_time:           string
    sign_string:         string
  }) {
    this.logger.log(`Click COMPLETE: ${params.merchant_trans_id}`)

    if (params.error < 0) {
      await this.prisma.payment.updateMany({
        where: { id: params.merchant_prepare_id },
        data:  { status: 'FAILED' },
      })
      return { error: 0, error_note: 'Success' }
    }

    if (!this.verifySign(params, 1)) {
      return { error: -1, error_note: "Noto'g'ri imzo" }
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: params.merchant_prepare_id },
    })
    if (!payment) return { error: -6, error_note: "To'lov topilmadi" }
    if (payment.status === 'PAID') return { error: 0, error_note: 'Already paid' }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data:  { status: 'PAID', externalId: params.click_trans_id },
    })

    await this.subService.activate(payment.userId, payment.plan as PlanKey, payment.id)
    this.logger.log(`✓ Click to'lov: ${payment.userId} → ${payment.plan}`)

    return {
      click_trans_id:      params.click_trans_id,
      merchant_trans_id:   params.merchant_trans_id,
      merchant_confirm_id: payment.id,
      error:               0,
      error_note:          'Success',
    }
  }

  generatePaymentUrl(userId: string, planKey: PlanKey): string {
    const plan    = PLANS[planKey]
    const transId = `${userId}:${planKey}`
    const returnUrl = encodeURIComponent(`${env('FRONTEND_URL', 'https://myhujjat.uz')}/dashboard/sozlamalar/obuna?status=success`)
    return `https://my.click.uz/services/pay?service_id=${env('CLICK_SERVICE_ID')}&merchant_id=${env('CLICK_MERCHANT_ID')}&amount=${plan.price}&transaction_param=${encodeURIComponent(transId)}&return_url=${returnUrl}`
  }
}
