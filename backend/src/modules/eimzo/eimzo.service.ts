import {
  Injectable, BadRequestException, Logger,
  OnModuleInit, OnModuleDestroy,
} from '@nestjs/common'
import { randomBytes } from 'crypto'
import * as forge      from 'node-forge'

const challengeStore = new Map<string, { challenge: string; expiredAt: number }>()

@Injectable()
export class EimzoService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EimzoService.name)
  private cleanupTimer?: NodeJS.Timeout

  onModuleInit() {
    // Har 60 soniyada eskirgan challenge'larni tozalash
    this.cleanupTimer = setInterval(() => {
      const now = Date.now()
      let removed = 0
      for (const [key, val] of challengeStore.entries()) {
        if (now > val.expiredAt) {
          challengeStore.delete(key)
          removed++
        }
      }
      if (removed > 0) this.logger.debug(`E-IMZO challenge cleanup: ${removed} ta o'chirildi`)
    }, 60_000)
    if (this.cleanupTimer.unref) this.cleanupTimer.unref()
  }

  onModuleDestroy() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer)
  }

  createChallenge(): { id: string; challenge: string } {
    const id        = randomBytes(16).toString('hex')
    const challenge = randomBytes(32).toString('hex')

    challengeStore.set(id, {
      challenge,
      expiredAt: Date.now() + 5 * 60 * 1000,
    })

    return { id, challenge }
  }

  verifySignature(params: {
    challengeId: string
    signature:   string
    certificate: string
  }): {
    valid:      boolean
    subject?:   Record<string, string>
    serialNum?: string
    notAfter?:  Date
  } {
    const stored = challengeStore.get(params.challengeId)

    if (!stored || Date.now() > stored.expiredAt) {
      throw new BadRequestException('Challenge topilmadi yoki muddati o\'tgan')
    }

    challengeStore.delete(params.challengeId)

    try {
      const signedDer = forge.util.decode64(params.signature)
      const p7        = (forge.pkcs7 as any).messageFromDer(signedDer)
      const cert      = p7.certificates?.[0]

      if (!cert) throw new BadRequestException('Sertifikat topilmadi')

      if (new Date() > cert.validity.notAfter) {
        throw new BadRequestException('Sertifikat muddati o\'tgan')
      }

      const isValid = p7.verify()

      const subject: Record<string, string> = {}
      cert.subject.attributes.forEach((attr: any) => {
        subject[attr.shortName] = attr.value
      })

      this.logger.log(`E-imzo: ${subject.CN || subject.SERIALNUMBER} imzoladi`)

      return {
        valid:     isValid,
        subject,
        serialNum: cert.serialNumber,
        notAfter:  cert.validity.notAfter,
      }
    } catch (error: any) {
      this.logger.error('E-imzo xatolik:', error?.message)
      throw new BadRequestException('Imzo yaroqsiz: ' + error?.message)
    }
  }
}
