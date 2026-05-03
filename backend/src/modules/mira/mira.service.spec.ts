import { MiraService } from './mira.service'
import { createMockPrisma, type MockPrisma } from '../../test/prisma-mock'

describe('MiraService.generateContractNumber', () => {
  let service: MiraService
  let prisma:  MockPrisma

  beforeEach(() => {
    prisma  = createMockPrisma()
    service = new MiraService(prisma as any)
  })

  describe("'date' rejimi", () => {
    it('bugungi sana qaytaradi', async () => {
      prisma.miraSettings.findUnique.mockResolvedValue({
        userId:           'u1',
        numberingScheme:  'date',
        lastCounter:      0,
        lastDateNumber:   null,
        customPrefix:     null,
      })

      const num = await service.generateContractNumber('u1')
      const today = new Date()
      const expected = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}`
      expect(num).toBe(expected)
    })
  })

  describe("'counter' rejimi (atomic increment)", () => {
    it('atomic increment ishlatadi (race-safe)', async () => {
      prisma.miraSettings.findUnique.mockResolvedValue({
        userId:           'u1',
        numberingScheme:  'counter',
        lastCounter:      5,
        customPrefix:     'DV',
      })
      // Atomic update qaytaradigan qiymat
      prisma.miraSettings.update.mockResolvedValue({
        lastCounter: 6,
        customPrefix: 'DV',
      })

      const num = await service.generateContractNumber('u1')

      // CRITICAL: update.data.lastCounter MUST use { increment: 1 }
      // Avvalgi find→app calc→update pattern emas. Bu race-condition'ga qarshi
      // himoya qiladi.
      expect(prisma.miraSettings.update).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        data:  { lastCounter: { increment: 1 } },
        select: { lastCounter: true, customPrefix: true },
      })
      expect(num).toBe('DV-006')
    })

    it("prefiks yo'q bo'lsa raqam o'zi", async () => {
      prisma.miraSettings.findUnique.mockResolvedValue({
        userId: 'u1', numberingScheme: 'counter', lastCounter: 0, customPrefix: null,
      })
      prisma.miraSettings.update.mockResolvedValue({ lastCounter: 1, customPrefix: null })

      const num = await service.generateContractNumber('u1')
      expect(num).toBe('001')
    })
  })

  describe("'date-seq' rejimi (Serializable + retry)", () => {
    const today = new Date()
    const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}`

    it("yangi kun — '03/05' qaytaradi", async () => {
      prisma.miraSettings.findUnique
        .mockResolvedValueOnce({ userId: 'u1', numberingScheme: 'date-seq' })  // outer
        .mockResolvedValueOnce({ lastDateNumber: '02/05' })                     // inside tx
      prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma))

      const num = await service.generateContractNumber('u1')
      expect(num).toBe(dateStr)
    })

    it("o'sha kun — '03/05-1', '03/05-2' ketma-ket", async () => {
      prisma.miraSettings.findUnique
        .mockResolvedValueOnce({ userId: 'u1', numberingScheme: 'date-seq' })
        .mockResolvedValueOnce({ lastDateNumber: dateStr })
      prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma))

      const num = await service.generateContractNumber('u1')
      expect(num).toBe(`${dateStr}-1`)
    })

    it('Serializable konflikt (P2034) — retry qiladi', async () => {
      prisma.miraSettings.findUnique
        .mockResolvedValueOnce({ userId: 'u1', numberingScheme: 'date-seq' })

      let attempts = 0
      prisma.$transaction.mockImplementation(async (cb: any) => {
        attempts++
        if (attempts === 1) {
          const err: any = new Error('Serialization failure')
          err.code = 'P2034'
          throw err
        }
        // Ikkinchi urinishda — muvaffaqiyat
        prisma.miraSettings.findUnique.mockResolvedValueOnce({ lastDateNumber: '' })
        return cb(prisma)
      })

      const num = await service.generateContractNumber('u1')
      expect(attempts).toBe(2)
      expect(num).toBe(dateStr)
    })

    it('3 ta urinishdan keyin throw qiladi', async () => {
      prisma.miraSettings.findUnique
        .mockResolvedValueOnce({ userId: 'u1', numberingScheme: 'date-seq' })

      prisma.$transaction.mockImplementation(async () => {
        const err: any = new Error('Serialization failure')
        err.code = 'P2034'
        throw err
      })

      await expect(service.generateContractNumber('u1'))
        .rejects.toThrow(/parallel konflikt|Serialization/)
    })
  })

  describe("'ask-each' rejimi", () => {
    it("NUMBERING_ASK_REQUIRED throw qiladi", async () => {
      prisma.miraSettings.findUnique.mockResolvedValue({
        userId: 'u1', numberingScheme: 'ask-each',
      })
      await expect(service.generateContractNumber('u1'))
        .rejects.toThrow('NUMBERING_ASK_REQUIRED')
    })
  })

  describe('Sozlama yo\'q', () => {
    it("default sana qaytaradi", async () => {
      prisma.miraSettings.findUnique.mockResolvedValue(null)
      const num = await service.generateContractNumber('u1')
      const today = new Date()
      const expected = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}`
      expect(num).toBe(expected)
    })
  })
})
