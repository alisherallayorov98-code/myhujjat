import { EimzoService } from './eimzo.service'
import { BadRequestException } from '@nestjs/common'

describe('EimzoService', () => {
  let service: EimzoService

  beforeEach(() => {
    service = new EimzoService()
  })

  afterEach(() => {
    service.onModuleDestroy()
  })

  describe('createChallenge', () => {
    it("unique id va challenge qaytaradi", () => {
      const c1 = service.createChallenge()
      const c2 = service.createChallenge()
      expect(c1.id).not.toBe(c2.id)
      expect(c1.challenge).not.toBe(c2.challenge)
      expect(c1.id).toMatch(/^[0-9a-f]{32}$/)        // 16 byte hex
      expect(c1.challenge).toMatch(/^[0-9a-f]{64}$/) // 32 byte hex
    })
  })

  describe('verifySignature — security checks', () => {
    it("dev bypass YO'Q (TEST_SIGNATURE qabul qilinmaydi)", () => {
      const { id } = service.createChallenge()

      // CRITICAL: NODE_ENV=development bo'lsa ham TEST_SIGNATURE
      // qabul qilinmasligi kerak (audit'da topilgan xavf).
      const oldEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      try {
        expect(() => {
          service.verifySignature({
            challengeId: id,
            signature:   'TEST_SIGNATURE',
            certificate: 'whatever',
          })
        }).toThrow(BadRequestException)
      } finally {
        process.env.NODE_ENV = oldEnv
      }
    })

    it("noma'lum challenge — xato", () => {
      expect(() => {
        service.verifySignature({
          challengeId: 'nomalum',
          signature:   'xxx',
          certificate: 'yyy',
        })
      }).toThrow(/Challenge topilmadi/)
    })

    it("yaroqsiz PKCS7 — xato", () => {
      const { id } = service.createChallenge()
      expect(() => {
        service.verifySignature({
          challengeId: id,
          signature:   'invalidbase64data',
          certificate: '',
        })
      }).toThrow(/yaroqsiz/i)
    })

    it("challenge bir martalik (replay attack himoya)", () => {
      const { id } = service.createChallenge()
      // 1-chi urinish — challenge mavjud (lekin signature yaroqsiz, baribir xato)
      expect(() => service.verifySignature({
        challengeId: id, signature: 'xxx', certificate: '',
      })).toThrow()
      // 2-chi urinish — challenge allaqachon o'chirilgan
      expect(() => service.verifySignature({
        challengeId: id, signature: 'xxx', certificate: '',
      })).toThrow(/Challenge topilmadi/)
    })
  })
})
