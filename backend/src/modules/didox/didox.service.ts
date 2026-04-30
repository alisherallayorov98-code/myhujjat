import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common'
import { PrismaService }      from '../prisma/prisma.service'
import axios                  from 'axios'
import { createHmac, timingSafeEqual } from 'crypto'
import { NotificationsService } from '../notifications/notifications.service'

@Injectable()
export class DidoxService {
  private readonly logger = new Logger(DidoxService.name)

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async sendInvoice(orgId: string, contractId: string, specId: string) {
    const contract = await this.prisma.contract.findFirst({
      where:   { id: contractId, organizationId: orgId },
      include: {
        organization:   true,
        counterparty:   true,
        specifications: { where: { id: specId } },
      },
    })

    if (!contract) throw new Error('Shartnoma topilmadi')

    const spec = contract.specifications[0]
    if (!spec) throw new Error('Spesifikatsiya topilmadi')

    const apiUrl = process.env.DIDOX_API_URL || 'https://api.didox.uz'
    const apiKey = process.env.DIDOX_API_KEY || ''

    const didoxPayload = {
      seller: {
        tin:      contract.organization?.inn,
        name:     contract.organization?.name,
        account:  contract.organization?.bankAccount,
        bankCode: contract.organization?.mfo,
      },
      buyer: {
        tin:      contract.counterparty?.inn,
        name:     contract.counterparty?.name,
        account:  contract.counterparty?.bankAccount,
        bankCode: contract.counterparty?.mfo,
      },
      contractNumber: contract.contractNumber,
      contractDate:   contract.contractDate,
      items: (spec.items as any[]).map((item: any, idx: number) => ({
        ordinal:  idx + 1,
        name:     item.nomi,
        unit:     item.birlik,
        count:    item.miqdori,
        price:    item.narxi,
        vatRate:  item.qqsFoiz === 'siz' ? 0 : Number(item.qqsFoiz),
        vatSum:   item.qqsSumma,
        amount:   item.summa,
      })),
      totalAmount: (spec.items as any[]).reduce((s: number, i: any) => s + (i.summa || 0), 0),
    }

    try {
      const response = await axios.post(
        `${apiUrl}/api/v1/invoices`,
        didoxPayload,
        {
          headers: {
            Authorization:  `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15_000,
        },
      )

      if (response.data?.id) {
        await this.prisma.contract.update({
          where: { id: contractId },
          data:  { didoxSent: true, didoxId: response.data.id },
        })
      }

      this.logger.log(`Didox ga yuborildi: ${contract.contractNumber}`)
      return { success: true, didoxId: response.data?.id }
    } catch (error: any) {
      this.logger.error('Didox xatolik:', error?.message)
      throw new Error('Didox ga yuborishda xatolik: ' + error?.message)
    }
  }

  async checkStatus(didoxId: string) {
    const apiUrl = process.env.DIDOX_API_URL || 'https://api.didox.uz'
    const apiKey = process.env.DIDOX_API_KEY || ''
    try {
      const response = await axios.get(
        `${apiUrl}/api/v1/invoices/${didoxId}/status`,
        { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 10_000 },
      )
      return response.data
    } catch {
      return { status: 'unknown' }
    }
  }

  // ─── Webhook handler ────────────────────────────────────────
  // Didox push events — invoice.created, invoice.signed, invoice.rejected, etc.
  async handleWebhook(rawBody: Buffer | undefined, signature: string, body: any) {
    const secret = process.env.DIDOX_WEBHOOK_SECRET
    if (!secret) {
      this.logger.warn('DIDOX_WEBHOOK_SECRET sozlanmagan — webhook tekshirilmaydi')
    } else {
      // HMAC-SHA256 signature tekshirish
      if (!signature || !rawBody) {
        throw new UnauthorizedException('Imzo yo\'q')
      }
      const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
      const sigBuf = Buffer.from(signature, 'utf8')
      const expBuf = Buffer.from(expected,  'utf8')
      if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
        this.logger.warn('Didox webhook: noto\'g\'ri imzo')
        throw new UnauthorizedException('Imzo noto\'g\'ri')
      }
    }

    const eventType = body?.event || body?.type
    const data      = body?.data  || body
    if (!eventType) {
      throw new BadRequestException('Event type yo\'q')
    }

    this.logger.log(`Didox webhook: ${eventType} ${data?.id || ''}`)

    switch (eventType) {
      case 'invoice.created':
      case 'invoice.received':
        return this.onInvoiceReceived(data)

      case 'invoice.signed':
      case 'invoice.accepted':
        return this.onInvoiceSigned(data)

      case 'invoice.rejected':
      case 'invoice.cancelled':
        return this.onInvoiceRejected(data)

      default:
        this.logger.log(`Didox webhook: noma'lum event ${eventType}`)
        return { ok: true, ignored: true }
    }
  }

  private async onInvoiceReceived(data: any) {
    const buyerInn = data?.buyer?.tin || data?.buyerInn
    if (!buyerInn) return { ok: true, skipped: 'no buyerInn' }

    const org = await this.prisma.organization.findFirst({ where: { inn: buyerInn } })
    if (!org) return { ok: true, skipped: 'org not found' }

    // Mavjud bo'lsa, takroran qo'shmaymiz
    const existing = await this.prisma.invoice.findFirst({
      where: { organizationId: org.id, didoxId: data.id },
    })
    if (existing) return { ok: true, skipped: 'duplicate' }

    await this.prisma.invoice.create({
      data: {
        organizationId: org.id,
        source:         'DIDOX',
        didoxId:        data.id,
        documentNumber: data.documentNumber || data.invoiceNumber,
        documentDate:   data.documentDate   || data.date,
        contractNumber: data.contractNumber,
        contractDate:   data.contractDate,
        sellerInn:      data.seller?.tin    || data.sellerInn,
        sellerName:     data.seller?.name   || data.sellerName,
        buyerInn:       buyerInn,
        buyerName:      data.buyer?.name    || data.buyerName,
        direction:      'INCOMING',
        amount:         Number(data.totalAmount || data.amount || 0),
        vatAmount:      Number(data.vatAmount || 0),
        totalAmount:    Number(data.totalAmount || data.amount || 0),
        status:         'PENDING',
      } as any,
    })

    await this.notifications.create({
      userId:  org.userId,
      type:    'INVOICE_RECEIVED',
      title:   'Yangi faktura keldi',
      message: `${data.seller?.name || 'Kontragent'} dan #${data.documentNumber || data.id} faktura qabul qilindi`,
      link:    '/dashboard/fakturalar',
    }).catch(() => {})

    return { ok: true }
  }

  private async onInvoiceSigned(data: any) {
    await this.prisma.invoice.updateMany({
      where: { didoxId: data.id },
      data:  { status: 'PAID' as any },
    })
    return { ok: true }
  }

  private async onInvoiceRejected(data: any) {
    await this.prisma.invoice.updateMany({
      where: { didoxId: data.id },
      data:  { status: 'CANCELLED' as any },
    })
    return { ok: true }
  }
}
