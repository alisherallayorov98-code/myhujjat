import { BulkSendService } from './bulk-send.service'
import { BadRequestException, ForbiddenException } from '@nestjs/common'
import { createMockPrisma, type MockPrisma } from '../../test/prisma-mock'

describe('BulkSendService.execute — race condition guard', () => {
  let service: BulkSendService
  let prisma:  MockPrisma
  let subs:    any

  beforeEach(() => {
    prisma = createMockPrisma()
    subs   = { getCurrent: jest.fn().mockResolvedValue({ plan: 'PRO' }) }

    service = new BulkSendService(
      prisma   as any,
      {} as any,  // ContractsService — execute test'da ishlatilmaydi
      {} as any,  // CounterpartiesService
      subs     as any,
      {} as any,  // AuditService
    )
  })

  const mockDraft = (overrides: any = {}) => ({
    id:             'd1',
    userId:         'u1',
    organizationId: 'o1',
    status:         'draft',
    items:          [{ stir: '301234567', name: 'Test MChJ', status: 'ready' }],
    ...overrides,
  })

  it('parallel ikki execute() — faqat birinchisi muvaffaqiyatli, ikkinchisi xato', async () => {
    prisma.bulkSendDraft.findUnique.mockResolvedValue(mockDraft())

    // 1-chi chaqiruv: claim (count: 1)
    // 2-chi chaqiruv: status allaqachon 'executing' — count: 0
    prisma.bulkSendDraft.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 })
    prisma.bulkSendDraft.update.mockResolvedValue(mockDraft({ status: 'completed' }))

    // Parallel ikki chaqiruv
    const r1Promise = service.execute('u1', 'd1')
    const r2Promise = service.execute('u1', 'd1').catch(e => e)

    await r1Promise.catch(() => {})  // contracts service yo'q — xato bo'ladi, lekin claim allaqachon ketgan
    const r2Error = await r2Promise

    expect(r2Error).toBeInstanceOf(BadRequestException)
    expect((r2Error as Error).message).toMatch(/allaqachon ishga tushirilgan/i)
  })

  it("conditional updateMany ishlatadi (status: 'draft' bo'lsa)", async () => {
    prisma.bulkSendDraft.findUnique.mockResolvedValue(mockDraft())
    prisma.bulkSendDraft.updateMany.mockResolvedValue({ count: 1 })
    prisma.bulkSendDraft.update.mockResolvedValue(mockDraft({ status: 'completed' }))

    await service.execute('u1', 'd1').catch(() => {})

    // CRITICAL: where clause status: 'draft' bilan filtrlanadi.
    // updateMany.count === 0 bo'lsa, claim muvaffaqiyatsiz.
    const call = prisma.bulkSendDraft.updateMany.mock.calls[0][0]
    expect(call.where.id).toBe('d1')
    expect(call.where.status).toBe('draft')
    expect(call.data.status).toBe('executing')
    expect(call.data.startedAt).toBeInstanceOf(Date)
  })

  it("PRO tarif emasligida ForbiddenException", async () => {
    subs.getCurrent.mockResolvedValue({ plan: 'FREE' })
    prisma.bulkSendDraft.findUnique.mockResolvedValue(mockDraft())

    await expect(service.execute('u1', 'd1')).rejects.toThrow(ForbiddenException)
  })

  it("draft yo'q — boshqa foydalanuvchi", async () => {
    subs.getCurrent.mockResolvedValue({ plan: 'PRO' })
    prisma.bulkSendDraft.findUnique.mockResolvedValue(mockDraft({ userId: 'OTHER' }))

    await expect(service.execute('u1', 'd1')).rejects.toThrow(ForbiddenException)
  })

  it("items > 50 — xato", async () => {
    prisma.bulkSendDraft.findUnique.mockResolvedValue(mockDraft({
      items: Array.from({ length: 51 }, (_, i) => ({ stir: String(i).padStart(9, '0'), status: 'ready' })),
    }))

    await expect(service.execute('u1', 'd1')).rejects.toThrow(/Maksimum 50/)
  })

  it("items bo'sh — xato", async () => {
    prisma.bulkSendDraft.findUnique.mockResolvedValue(mockDraft({ items: [] }))

    await expect(service.execute('u1', 'd1')).rejects.toThrow(/Kontragentlar yo'q/)
  })
})
