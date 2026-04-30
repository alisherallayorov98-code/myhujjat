import {
  Injectable, BadRequestException, Logger,
} from '@nestjs/common'
import { randomBytes } from 'crypto'
import * as forge      from 'node-forge'

const challengeStore = new Map<string, { challenge: string; expiredAt: number }>()

@Injectable()
export class EimzoService {
  private readonly logger = new Logger(EimzoService.name)

  createChallenge(): { id: string; challenge: string } {
    const id        = randomBytes(16).toString('hex')
    const challenge = randomBytes(32).toString('hex')

    challengeStore.set(id, {
      challenge,
      expiredAt: Date.now() + 5 * 60 * 1000,
    })

    if (challengeStore.size > 1000) {
      const now = Date.now()
      for (const [key, val] of challengeStore.entries()) {
        if (now > val.expiredAt) challengeStore.delete(key)
      }
    }

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

    // Development bypass
    if (process.env.NODE_ENV === 'development' && params.signature === 'TEST_SIGNATURE') {
      return {
        valid:   true,
        subject: { CN: 'Test User', SERIALNUMBER: '12345' },
      }
    }

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
