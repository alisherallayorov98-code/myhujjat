import { SubscriptionService } from './subscription.service'
import { createMockPrisma, type MockPrisma } from '../../test/prisma-mock'

describe('SubscriptionService.incrementContractCount — atomic check', () => {
  let service: SubscriptionService
  let prisma:  MockPrisma

  beforeEach(() => {
    prisma  = createMockPrisma()
    service = new SubscriptionService(prisma as any, {} as any)
  })

  const mockSub = (overrides: any = {}) => ({
    userId:        'u1',
    plan:          'FREE',
    status:        'ACTIVE',
    contractCount: 0,
    expiresAt:     null,
    ...overrides,
  })

  it('PRO foydalanuvchi — har doim true (limit yo\'q)', async () => {
    prisma.subscription.findUnique.mockResolvedValue(mockSub({ plan: 'PRO' }))
    prisma.subscription.updateMany.mockResolvedValue({ count: 1 })

    const ok = await service.incrementContractCount('u1')
    expect(ok).toBe(true)
  })

  it("conditional updateMany — limitlar where clause'da", async () => {
    prisma.subscription.findUnique.mockResolvedValue(mockSub({ plan: 'PRO' }))
    prisma.subscription.updateMany.mockResolvedValue({ count: 1 })

    await service.incrementContractCount('u1')

    const call = prisma.subscription.updateMany.mock.calls[0][0]
    // Where clause OR ichida har plan uchun limit shartlari
    expect(call.where.userId).toBe('u1')
    expect(call.where.status).toBe('ACTIVE')
    expect(call.where.OR).toBeDefined()
    expect(call.where.OR.length).toBeGreaterThanOrEqual(4)
    // increment atomic
    expect(call.data.contractCount).toEqual({ increment: 1 })
  })

  it('FREE foydalanuvchi 3 ta limitda — false', async () => {
    prisma.subscription.findUnique.mockResolvedValue(mockSub({ plan: 'FREE', contractCount: 3 }))
    // updateMany 0 row update qiladi (limit shartiga to'g'ri kelmaydi)
    prisma.subscription.updateMany.mockResolvedValue({ count: 0 })

    const ok = await service.incrementContractCount('u1')
    expect(ok).toBe(false)
  })

  it('STANDARD foydalanuvchi 50 ta limitda — false', async () => {
    prisma.subscription.findUnique.mockResolvedValue(mockSub({ plan: 'STANDARD', contractCount: 50 }))
    prisma.subscription.updateMany.mockResolvedValue({ count: 0 })

    const ok = await service.incrementContractCount('u1')
    expect(ok).toBe(false)
  })

  it('STANDARD 49 ta — true (oxirgi shartnoma)', async () => {
    prisma.subscription.findUnique.mockResolvedValue(mockSub({ plan: 'STANDARD', contractCount: 49 }))
    prisma.subscription.updateMany.mockResolvedValue({ count: 1 })

    const ok = await service.incrementContractCount('u1')
    expect(ok).toBe(true)
  })

  it('Expire bo\'lgan PRO — getCurrent FREE\'ga tushiradi → updateMany count: 0', async () => {
    prisma.subscription.findUnique.mockResolvedValue(mockSub({
      plan:      'PRO',
      status:    'ACTIVE',
      expiresAt: new Date(Date.now() - 1000),  // o'tib ketgan
    }))
    // getCurrent expired'ni FREE'ga aylantiradi
    prisma.subscription.update.mockResolvedValue(mockSub({ plan: 'FREE', status: 'EXPIRED' }))

    // Endi updateMany ham FREE limit'ini hisobga oladi
    prisma.subscription.updateMany.mockResolvedValue({ count: 0 })  // 3+ contracts

    const ok = await service.incrementContractCount('u1')
    expect(ok).toBe(false)
    // getCurrent expired'ni avtomatik aylantirdi
    expect(prisma.subscription.update).toHaveBeenCalled()
  })

  it('CANCELLED status — false', async () => {
    prisma.subscription.findUnique.mockResolvedValue(mockSub({
      plan: 'PRO', status: 'CANCELLED',
    }))
    // status 'ACTIVE' emas — updateMany topa olmaydi
    prisma.subscription.updateMany.mockResolvedValue({ count: 0 })

    const ok = await service.incrementContractCount('u1')
    expect(ok).toBe(false)
  })
})
