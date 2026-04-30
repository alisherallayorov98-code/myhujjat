import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common'
import { authenticator } from 'otplib'
import * as QRCode from 'qrcode'
import { PrismaService } from '../prisma/prisma.service'
import { CryptoService } from '../../common/services/crypto.service'

@Injectable()
export class TwoFactorService {
  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
  ) {
    // 30s window — Google Authenticator standart
    authenticator.options = { window: 1 }
  }

  // ─── 2FA holatini tekshirish ──────────────────────────────
  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { twoFactorEnabled: true },
    })
    return { enabled: !!user?.twoFactorEnabled }
  }

  // ─── 2FA boshlash — secret va QR yaratish ─────────────────
  async setup(userId: string) {
    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { email: true, twoFactorEnabled: true },
    })
    if (!user) throw new BadRequestException('Foydalanuvchi topilmadi')
    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA allaqachon yoqilgan')
    }

    const secret = authenticator.generateSecret()
    const otpAuthUrl = authenticator.keyuri(user.email, 'MyHujjat.uz', secret)
    const qrDataUrl  = await QRCode.toDataURL(otpAuthUrl)

    // Vaqtinchalik secret saqlash (verify qilingunga qadar enabled emas)
    await this.prisma.user.update({
      where: { id: userId },
      data:  { twoFactorSecret: this.crypto.encrypt(secret) },
    })

    return {
      secret,         // foydalanuvchi qo'lda kiritish uchun
      qrCode: qrDataUrl,
      url:    otpAuthUrl,
    }
  }

  // ─── Verify va yoqish ────────────────────────────────────
  async enable(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    })
    if (!user?.twoFactorSecret) {
      throw new BadRequestException("Avval setup'ni boshlang")
    }
    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA allaqachon yoqilgan')
    }

    const secret = this.crypto.decrypt(user.twoFactorSecret)
    const valid  = authenticator.verify({ token: code.replace(/\s/g, ''), secret })
    if (!valid) {
      throw new BadRequestException("Kod noto'g'ri")
    }

    // Backup kodlar generate qilish
    const backupCodes = Array.from({ length: 8 }, () =>
      this.crypto.randomToken(12).replace(/[^A-Z0-9]/gi, '').slice(0, 8).toUpperCase().padEnd(8, '0')
    )

    await this.prisma.user.update({
      where: { id: userId },
      data:  {
        twoFactorEnabled: true,
        twoFactorBackup:  this.crypto.encrypt(JSON.stringify(backupCodes)),
      },
    })

    return { success: true, backupCodes }
  }

  // ─── 2FA o'chirish (parol bilan) ──────────────────────────
  async disable(userId: string, code: string) {
    const valid = await this.verify(userId, code)
    if (!valid) throw new BadRequestException("Kod noto'g'ri")

    await this.prisma.user.update({
      where: { id: userId },
      data:  {
        twoFactorEnabled: false,
        twoFactorSecret:  null,
        twoFactorBackup:  null,
      },
    })
    return { success: true }
  }

  // ─── Login paytida verify (login service ishlatadi) ──────
  async verify(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { twoFactorSecret: true, twoFactorBackup: true, twoFactorEnabled: true },
    })
    if (!user?.twoFactorEnabled || !user.twoFactorSecret) return true  // yoqilmagan

    const cleanCode = code.replace(/\s/g, '').toUpperCase()
    const secret    = this.crypto.decrypt(user.twoFactorSecret)

    // 1. TOTP verify
    if (authenticator.verify({ token: cleanCode, secret })) return true

    // 2. Backup kod tekshirish
    if (user.twoFactorBackup) {
      const codes = JSON.parse(this.crypto.decrypt(user.twoFactorBackup)) as string[]
      const idx = codes.indexOf(cleanCode)
      if (idx >= 0) {
        // Backup kod ishlatildi — o'chiramiz
        codes.splice(idx, 1)
        await this.prisma.user.update({
          where: { id: userId },
          data:  { twoFactorBackup: this.crypto.encrypt(JSON.stringify(codes)) },
        })
        return true
      }
    }

    return false
  }

  // ─── Yangi backup kodlar yaratish ────────────────────────
  async regenerateBackupCodes(userId: string) {
    const codes = Array.from({ length: 8 }, () =>
      this.crypto.randomToken(12).replace(/[^A-Z0-9]/gi, '').slice(0, 8).toUpperCase().padEnd(8, '0')
    )
    await this.prisma.user.update({
      where: { id: userId },
      data:  { twoFactorBackup: this.crypto.encrypt(JSON.stringify(codes)) },
    })
    return { backupCodes: codes }
  }
}
