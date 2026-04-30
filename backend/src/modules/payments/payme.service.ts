import { Injectable, Logger } from '@nestjs/common'
import { PrismaService }       from '../prisma/prisma.service'
import { SubscriptionService, PLANS, PlanKey } from '../subscriptions/subscription.service'

const PAYME_KEY        = process.env.PAYME_SECRET_KEY  || ''
const PAYME_MERCHANT_ID = process.env.PAYME_MERCHANT_ID || ''

function err(id: any, code: number, message: string) {
  return {
    jsonrpc: '2.0', id,
    error: { code, message: { uz: message, ru: message, en: message } },
  }
}

function ok(id: any, result: Record<string, unknown>) {
  return { jsonrpc: '2.0', id, result }
}

@Injectable()
export class PaymeService {
  private readonly logger = new Logger(PaymeService.name)

  constructor(
    private prisma:     PrismaService,
    private subService: SubscriptionService,
  ) {}

  verifyAuth(authHeader: string): boolean {
    const expected = `Basic ${Buffer.from(`Paycom:${PAYME_KEY}`).toString('base64')}`
    return authHeader === expected
  }

  async handle(id: any, method: string, params: any) {
    switch (method) {
      case 'CheckPerformTransaction': return this.checkPerform(id, params)
      case 'CreateTransaction':       return this.createTransaction(id, params)
      case 'PerformTransaction':      return this.performTransaction(id, params)
      case 'CancelTransaction':       return this.cancelTransaction(id, params)
      case 'CheckTransaction':        return this.checkTransaction(id, params)
      default:                        return err(id, -32601, 'Method not found')
    }
  }

  private async checkPerform(id: any, params: any) {
    const [userId, planKey] = (params?.account?.account || '').split(':')
    if (!userId || !planKey) return err(id, -31050, "Noto'g'ri account")

    const plan = PLANS[planKey as PlanKey]
    if (!plan) return err(id, -31050, "Noto'g'ri reja")

    if (Math.abs(params.amount - plan.price * 100) > 100) {
      return err(id, -31001, "Noto'g'ri summa")
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) return err(id, -31050, 'Foydalanuvchi topilmadi')

    return ok(id, { allow: true })
  }

  private async createTransaction(id: any, params: any) {
    const [userId, planKey] = (params?.account?.account || '').split(':')
    const plan = PLANS[planKey as PlanKey]
    if (!plan) return err(id, -31050, "Noto'g'ri reja")

    let payment = await this.prisma.payment.findFirst({
      where: { externalId: params.id, provider: 'PAYME' },
    })

    if (payment) {
      if (payment.status === 'PAID') return err(id, -31099, "Allaqachon to'langan")
      return ok(id, {
        create_time:  payment.createdAt.getTime(),
        perform_time: 0,
        cancel_time:  0,
        transaction:  payment.id,
        state:        1,
        reason:       null,
      })
    }

    payment = await this.prisma.payment.create({
      data: {
        userId,
        provider:   'PAYME',
        externalId: params.id,
        amount:     plan.price,
        currency:   'UZS',
        plan:       planKey,
        months:     plan.months,
        status:     'PENDING',
        metadata:   params,
      },
    })

    return ok(id, {
      create_time:  payment.createdAt.getTime(),
      perform_time: 0,
      cancel_time:  0,
      transaction:  payment.id,
      state:        1,
      reason:       null,
    })
  }

  private async performTransaction(id: any, params: any) {
    const payment = await this.prisma.payment.findFirst({
      where: { externalId: params.id, provider: 'PAYME' },
    })
    if (!payment) return err(id, -31003, 'Transaction topilmadi')

    if (payment.status === 'PAID') {
      return ok(id, {
        perform_time: payment.updatedAt.getTime(),
        transaction:  payment.id,
        state:        2,
      })
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data:  { status: 'PAID' },
    })
    await this.subService.activate(payment.userId, payment.plan as PlanKey, payment.id)
    this.logger.log(`✓ Payme to'lov: ${payment.userId} → ${payment.plan}`)

    return ok(id, { perform_time: Date.now(), transaction: payment.id, state: 2 })
  }

  private async cancelTransaction(id: any, params: any) {
    const payment = await this.prisma.payment.findFirst({
      where: { externalId: params.id, provider: 'PAYME' },
    })
    if (!payment) return err(id, -31003, 'Transaction topilmadi')

    await this.prisma.payment.update({
      where: { id: payment.id },
      data:  { status: 'CANCELLED' },
    })

    return ok(id, { cancel_time: Date.now(), transaction: payment.id, state: -1 })
  }

  private async checkTransaction(id: any, params: any) {
    const payment = await this.prisma.payment.findFirst({
      where: { externalId: params.id, provider: 'PAYME' },
    })
    if (!payment) return err(id, -31003, 'Transaction topilmadi')

    const state =
      payment.status === 'PAID'      ? 2  :
      payment.status === 'CANCELLED' ? -1 : 1

    return ok(id, {
      create_time:  payment.createdAt.getTime(),
      perform_time: payment.status === 'PAID'      ? payment.updatedAt.getTime() : 0,
      cancel_time:  payment.status === 'CANCELLED' ? payment.updatedAt.getTime() : 0,
      transaction:  payment.id,
      state,
      reason:       null,
    })
  }

  generatePaymentUrl(userId: string, planKey: PlanKey): string {
    const plan = PLANS[planKey]
    return `https://checkout.paycom.uz/${PAYME_MERCHANT_ID}?amount=${plan.price * 100}&account[account]=${userId}:${planKey}`
  }
}
