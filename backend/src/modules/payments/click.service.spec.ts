import { ClickService } from './click.service'
import { createMockPrisma, type MockPrisma } from '../../test/prisma-mock'
import { createHash } from 'crypto'

// Test'larda env'ni o'rnatish kerak — ClickService import vaqtida o'qiydi
process.env.CLICK_SERVICE_ID  = 'test_service'
process.env.CLICK_MERCHANT_ID = 'test_merchant'
process.env.CLICK_SECRET_KEY  = 'test_secret_key'

function calcSign(params: Record<string, any>, action: number): string {
  return createHash('md5')
    .update(
      `${params.click_trans_id}test_servicetest_secret_key${params.merchant_trans_id}` +
      `${action === 1 ? (params.merchant_prepare_id || '') : ''}` +
      `${params.amount}${action}${params.sign_time}`
    )
    .digest('hex')
}

describe('ClickService — webhook security', () => {
  let service: ClickService
  let prisma:  MockPrisma
  let subs:    any

  beforeEach(() => {
    prisma = createMockPrisma()
    subs   = { activate: jest.fn().mockResolvedValue({}) }
    service = new ClickService(prisma as any, subs as any)
  })

  describe('prepare', () => {
    const validParams = (signOverride?: string) => {
      const base = {
        click_trans_id:    'click123',
        service_id:        'test_service',
        merchant_trans_id: 'user1:pro_1m',
        amount:            299_000,
        action:            0,
        sign_time:         '2026-05-04 10:00:00',
      } as any
      base.sign_string = signOverride ?? calcSign(base, 0)
      return base
    }

    it("noto'g'ri imzo bilan rad qiladi (-1)", async () => {
      const r = await service.prepare(validParams('FAKE_SIGNATURE'))
      expect(r.error).toBe(-1)
      expect(prisma.payment.create).not.toHaveBeenCalled()
    })

    it("noto'g'ri merchant_trans_id format — -5", async () => {
      const params = validParams()
      params.merchant_trans_id = 'invalid-format'
      params.sign_string = calcSign(params, 0)
      const r = await service.prepare(params)
      expect(r.error).toBe(-5)
    })

    it("foydalanuvchi yo'q — -5", async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      const r = await service.prepare(validParams())
      expect(r.error).toBe(-5)
    })

    it("noto'g'ri summa — -2", async () => {
      const params = validParams()
      params.amount = 1_000  // pro_1m narxi 299,000 emas
      params.sign_string = calcSign(params, 0)
      const r = await service.prepare(params)
      expect(r.error).toBe(-2)
    })

    it("muvaffaqiyatli prepare — Payment yaratiladi", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user1' })
      prisma.payment.create.mockResolvedValue({ id: 'pay123' })

      const r = await service.prepare(validParams())
      expect(r.error).toBe(0)
      expect(r.merchant_prepare_id).toBe('pay123')
      expect(prisma.payment.create).toHaveBeenCalled()
      const createCall = prisma.payment.create.mock.calls[0][0]
      expect(createCall.data.status).toBe('PENDING')
      expect(createCall.data.amount).toBe(299_000)
      expect(createCall.data.plan).toBe('pro_1m')
    })
  })

  describe('complete (idempotency)', () => {
    const completeParams = (overrides: any = {}) => {
      const base = {
        click_trans_id:      'click123',
        service_id:          'test_service',
        merchant_trans_id:   'user1:pro_1m',
        merchant_prepare_id: 'pay123',
        amount:              299_000,
        action:              1,
        error:               0,
        sign_time:           '2026-05-04 10:01:00',
        ...overrides,
      } as any
      base.sign_string = calcSign(base, 1)
      return base
    }

    it("allaqachon PAID — qaytadan activate qilmaydi (idempotent)", async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: 'pay123', userId: 'user1', plan: 'pro_1m', status: 'PAID',
      })

      const r = await service.complete(completeParams())
      expect(r.error).toBe(0)
      expect(subs.activate).not.toHaveBeenCalled()
      expect(prisma.payment.update).not.toHaveBeenCalled()
    })

    it("PENDING → PAID + subscription activate", async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: 'pay123', userId: 'user1', plan: 'pro_1m', status: 'PENDING',
      })
      prisma.payment.update.mockResolvedValue({})

      const r = await service.complete(completeParams())
      expect(r.error).toBe(0)
      expect(subs.activate).toHaveBeenCalledWith('user1', 'pro_1m', 'pay123')
    })

    it("error < 0 — PAYMENT FAILED markazlash, activate yo'q", async () => {
      const r = await service.complete(completeParams({ error: -3, sign_string: '' }))
      expect(r.error).toBe(0)
      expect(subs.activate).not.toHaveBeenCalled()
      expect(prisma.payment.updateMany).toHaveBeenCalledWith({
        where: { id: 'pay123' },
        data:  { status: 'FAILED' },
      })
    })

    it("noto'g'ri imzo — -1", async () => {
      const params = completeParams()
      params.sign_string = 'FAKE'
      const r = await service.complete(params)
      expect(r.error).toBe(-1)
      expect(subs.activate).not.toHaveBeenCalled()
    })

    it("Payment topilmadi — -6", async () => {
      prisma.payment.findUnique.mockResolvedValue(null)
      const r = await service.complete(completeParams())
      expect(r.error).toBe(-6)
    })
  })
})
