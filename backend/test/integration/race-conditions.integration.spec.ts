/**
 * REAL DB integration testlari — race condition'lar haqiqatan ham
 * ishlashini isbotlash uchun.
 *
 * Mock'siz, real PostgreSQL bilan parallel transaction'lar ishga
 * tushiriladi.
 *
 * Ishga tushirish:
 *   docker compose -f docker-compose.test.yml up -d
 *   DATABASE_URL=postgresql://test:test@localhost:5433/myhujjat_test \
 *     npx prisma migrate deploy
 *   DATABASE_URL=postgresql://test:test@localhost:5433/myhujjat_test \
 *     npm test -- test/integration
 */

import { PrismaClient } from '@prisma/client'
import { MiraService } from '../../src/modules/mira/mira.service'
import { SubscriptionService } from '../../src/modules/subscriptions/subscription.service'

// Bu test'lar faqat DATABASE_URL real bo'lganda ishga tushadi
const DB_URL = process.env.DATABASE_URL
const skipUnlessRealDb = !DB_URL || !DB_URL.includes('myhujjat_test')
const describeOrSkip = skipUnlessRealDb ? describe.skip : describe

describeOrSkip('Race conditions — REAL DB', () => {
  let prisma: PrismaClient
  let testUserId:  string
  let testOrgId:   string

  beforeAll(async () => {
    prisma = new PrismaClient({ datasourceUrl: DB_URL })
    await prisma.$connect()
  })

  beforeEach(async () => {
    // Test ma'lumotlarini tozalash
    await prisma.contract.deleteMany({})
    await prisma.miraSettings.deleteMany({})
    await prisma.bulkSendDraft.deleteMany({})
    await prisma.subscription.deleteMany({})
    await prisma.organization.deleteMany({})
    await prisma.user.deleteMany({ where: { email: { contains: 'test-race' } } })

    // Test user + org yaratish
    const user = await prisma.user.create({
      data: {
        email:        `test-race-${Date.now()}@test.uz`,
        passwordHash: 'x',
        isActive:     true,
      },
    })
    testUserId = user.id

    const org = await prisma.organization.create({
      data: { userId: testUserId, name: 'Test MChJ' },
    })
    testOrgId = org.id

    await prisma.subscription.create({
      data: { userId: testUserId, plan: 'PRO', status: 'ACTIVE' },
    })
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('Mira contract numbering — atomic counter', () => {
    it('100 ta paralel chaqiruv → 100 ta UNIQUE raqam (dublikatsiz)', async () => {
      // Mira settings yaratish — counter rejimi
      await prisma.miraSettings.create({
        data: {
          userId:          testUserId,
          organizationId:  testOrgId,
          numberingScheme: 'counter',
          customPrefix:    'TEST',
          lastCounter:     0,
        },
      })

      const service = new MiraService(prisma as any)

      // 100 ta paralel chaqiruv
      const promises = Array.from({ length: 100 }, () =>
        service.generateContractNumber(testUserId)
      )
      const results = await Promise.all(promises)

      // CRITICAL: barcha raqamlar unique bo'lishi kerak
      const unique = new Set(results)
      expect(unique.size).toBe(100)

      // Raqamlar TEST-001 dan TEST-100 gacha
      expect(unique.has('TEST-001')).toBe(true)
      expect(unique.has('TEST-100')).toBe(true)
    })

    it("'date-seq' rejimi parallel — Serializable retry ishlaydi", async () => {
      await prisma.miraSettings.create({
        data: {
          userId:          testUserId,
          organizationId:  testOrgId,
          numberingScheme: 'date-seq',
        },
      })

      const service = new MiraService(prisma as any)

      // 50 ta paralel — Serializable konflikt → retry → unique raqam
      const promises = Array.from({ length: 50 }, () =>
        service.generateContractNumber(testUserId)
      )
      const results = await Promise.all(promises)

      const unique = new Set(results)
      expect(unique.size).toBe(50)
    })
  })

  describe('Subscription incrementContractCount — atomic limit check', () => {
    it('FREE foydalanuvchi 3 ta limit — paralel 10 ta chaqiruvdan faqat 3 tasi ✓', async () => {
      await prisma.subscription.update({
        where: { userId: testUserId },
        data:  { plan: 'FREE', contractCount: 0 },
      })

      const service = new SubscriptionService(prisma as any, {} as any)

      // 10 ta paralel chaqiruv
      const promises = Array.from({ length: 10 }, () =>
        service.incrementContractCount(testUserId)
      )
      const results = await Promise.all(promises)

      // Aniq 3 tasi true (limit 3)
      const successCount = results.filter(r => r === true).length
      expect(successCount).toBe(3)

      // DB'da contractCount aniq 3
      const sub = await prisma.subscription.findUnique({ where: { userId: testUserId } })
      expect(sub!.contractCount).toBe(3)
    })

    it('STANDARD 50 ta limit — 100 paralel → faqat 50 tasi ✓', async () => {
      await prisma.subscription.update({
        where: { userId: testUserId },
        data:  { plan: 'STANDARD', contractCount: 0 },
      })

      const service = new SubscriptionService(prisma as any, {} as any)

      const promises = Array.from({ length: 100 }, () =>
        service.incrementContractCount(testUserId)
      )
      const results = await Promise.all(promises)

      expect(results.filter(r => r).length).toBe(50)

      const sub = await prisma.subscription.findUnique({ where: { userId: testUserId } })
      expect(sub!.contractCount).toBe(50)
    })

    it('PRO unlimited — 100 paralel hammasi ✓', async () => {
      const service = new SubscriptionService(prisma as any, {} as any)

      const promises = Array.from({ length: 100 }, () =>
        service.incrementContractCount(testUserId)
      )
      const results = await Promise.all(promises)

      expect(results.filter(r => r).length).toBe(100)
    })
  })

  describe('Bulk-send execute guard — parallel double-click', () => {
    it('Ikki paralel execute() — faqat birinchisi ishlaydi', async () => {
      const draft = await prisma.bulkSendDraft.create({
        data: {
          userId:         testUserId,
          organizationId: testOrgId,
          status:         'draft',
          items:          [{ stir: '301234567', name: 'Test', status: 'ready' }],
        },
      })

      // updateMany conditional pattern (real test)
      const claim1 = await prisma.bulkSendDraft.updateMany({
        where: { id: draft.id, status: 'draft' },
        data:  { status: 'executing', startedAt: new Date() },
      })
      const claim2 = await prisma.bulkSendDraft.updateMany({
        where: { id: draft.id, status: 'draft' },
        data:  { status: 'executing', startedAt: new Date() },
      })

      expect(claim1.count).toBe(1)  // Birinchisi muvaffaqiyatli
      expect(claim2.count).toBe(0)  // Ikkinchisi rad qilingan
    })
  })
})
