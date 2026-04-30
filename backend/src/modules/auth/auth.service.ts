import {
  Injectable, UnauthorizedException,
  BadRequestException, ConflictException,
  NotFoundException
} from '@nestjs/common'
import { JwtService }    from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service'
import { MailService }          from '../mail/mail.service'
import { AuditService }         from '../audit/audit.service'
import { NotificationsService } from '../notifications/notifications.service'
import { TwoFactorService }     from './two-factor.service'
import * as bcrypt       from 'bcrypt'
import { randomBytes }   from 'crypto'

@Injectable()
export class AuthService {
  private loginAttempts = new Map<string, { count: number; blockedUntil: number }>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(
    private prisma:               PrismaService,
    private jwtService:           JwtService,
    private mailService:          MailService,
    private auditService:         AuditService,
    private notificationsService: NotificationsService,
    private twoFactor:            TwoFactorService,
  ) {
    // Memory leak'ni oldini olish — har 30 daqiqada eski yozuvlarni tozalash
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, val] of this.loginAttempts.entries()) {
        if (val.blockedUntil < now && val.count === 0) {
          this.loginAttempts.delete(key)
        }
      }
    }, 30 * 60 * 1000)
  }

  onModuleDestroy() {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval)
  }

  // ============================================
  // RO'YXATDAN O'TISH
  // ============================================
  async register(dto: {
    email:      string
    password:   string
    firstName?: string
    lastName?:  string
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() }
    })
    if (existing) {
      throw new ConflictException("Bu email allaqachon ro'yxatdan o'tgan")
    }

    if (dto.password.length < 8) {
      throw new BadRequestException("Parol kamida 8 ta belgidan iborat bo'lishi kerak")
    }

    const passwordHash = await bcrypt.hash(dto.password, 12)
    const verifyToken  = randomBytes(32).toString('hex')

    const user = await this.prisma.user.create({
      data: {
        email:        dto.email.toLowerCase().trim(),
        passwordHash,
        firstName:    dto.firstName,
        lastName:     dto.lastName,
        verifyToken,
        subscription: {
          create: {
            plan:      'FREE',
            status:    'ACTIVE',
            startedAt: new Date(),
          }
        }
      }
    })

    // Email tasdiqlash xatini yuborish
    this.mailService.sendVerification(user.email, user.firstName || '', verifyToken)
      .catch(() => {}) // Emaillar async — xatolik registrationni to'xtatmasin

    // Welcome notification
    this.notificationsService.create({
      userId:  user.id,
      type:    'WELCOME',
      title:   `Xush kelibsiz, ${user.firstName || 'Foydalanuvchi'}!`,
      message: "MyHujjat.uz ga ro'yxatdan o'tganingiz uchun rahmat. Boshlash uchun avval tashkilotingizni qo'shing.",
      link:    '/dashboard/tashkilotlar',
    }).catch(() => {})

    return {
      message: "Ro'yxatdan o'tish muvaffaqiyatli. Email tasdiqlang.",
      userId:  user.id,
    }
  }

  // ============================================
  // KIRISH
  // ============================================
  async login(dto: { email: string; password: string; code?: string; ip?: string }) {
    const key = dto.ip || dto.email

    const attempt = this.loginAttempts.get(key)
    if (attempt && Date.now() < attempt.blockedUntil) {
      const remainSec = Math.ceil((attempt.blockedUntil - Date.now()) / 1000)
      throw new UnauthorizedException(
        `Juda ko'p urinish. ${remainSec} soniyadan so'ng qayta urining.`
      )
    }

    const user = await this.prisma.user.findUnique({
      where:   { email: dto.email.toLowerCase().trim() },
      include: { subscription: true }
    })

    if (!user || !await bcrypt.compare(dto.password, user.passwordHash)) {
      const cur = this.loginAttempts.get(key) || { count: 0, blockedUntil: 0 }
      cur.count++
      if (cur.count >= 5) {
        cur.blockedUntil = Date.now() + 15 * 60 * 1000
        cur.count = 0
      }
      this.loginAttempts.set(key, cur)
      throw new UnauthorizedException("Email yoki parol noto'g'ri")
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Hisob bloklangan')
    }

    // ─── 2FA tekshirish ─────────────────────────────────────
    if (user.twoFactorEnabled) {
      if (!dto.code) {
        // Frontend bu javobni ko'rsa, 2FA inputi chiqaradi
        throw new UnauthorizedException({
          message:     'Ikki bosqichli kod kerak',
          requires2FA: true,
        } as any)
      }
      const valid = await this.twoFactor.verify(user.id, dto.code)
      if (!valid) {
        const cur = this.loginAttempts.get(key) || { count: 0, blockedUntil: 0 }
        cur.count++
        if (cur.count >= 5) {
          cur.blockedUntil = Date.now() + 15 * 60 * 1000
          cur.count = 0
        }
        this.loginAttempts.set(key, cur)
        throw new UnauthorizedException({
          message:     "2FA kod noto'g'ri",
          requires2FA: true,
        } as any)
      }
    }

    this.loginAttempts.delete(key)

    this.auditService.log({
      userId:    user.id,
      action:    'USER_LOGIN',
      ipAddress: dto.ip,
    })

    return this.generateTokens(user)
  }

  // ============================================
  // TOKENLAR YARATISH
  // ============================================
  async generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role }

    const accessToken = this.jwtService.sign(payload, {
      secret:    process.env.JWT_SECRET,
      expiresIn: '15m',
    })

    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' }
    )

    await this.prisma.refreshToken.create({
      data: {
        userId:    user.id,
        token:     refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }
    })

    return {
      accessToken,
      refreshToken,
      user: {
        id:           user.id,
        email:        user.email,
        firstName:    user.firstName,
        lastName:     user.lastName,
        role:         user.role,
        language:     user.language,
        subscription: user.subscription,
      }
    }
  }

  // ============================================
  // TOKEN YANGILASH
  // ============================================
  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      })

      const stored = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken }
      })

      if (!stored || stored.expiresAt < new Date()) {
        throw new UnauthorizedException('Token yaroqsiz')
      }

      await this.prisma.refreshToken.delete({ where: { token: refreshToken } })

      const user = await this.prisma.user.findUnique({
        where:   { id: payload.sub },
        include: { subscription: true }
      })

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Foydalanuvchi topilmadi')
      }

      return this.generateTokens(user)
    } catch {
      throw new UnauthorizedException('Token yaroqsiz')
    }
  }

  // ============================================
  // CHIQISH
  // ============================================
  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken }
    }).catch(() => {})
    return { message: 'Muvaffaqiyatli chiqildi' }
  }

  // ============================================
  // PAROL TIKLASH
  // ============================================
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (!user) {
      return { message: "Agar email mavjud bo'lsa, xabar yuborildi" }
    }

    const resetToken = randomBytes(32).toString('hex')
    const resetExp   = new Date(Date.now() + 60 * 60 * 1000)

    await this.prisma.user.update({
      where: { id: user.id },
      data:  { resetToken, resetTokenExp: resetExp }
    })

    this.mailService.sendPasswordReset(user.email, user.firstName || '', resetToken)
      .catch(() => {})

    return { message: 'Parol tiklash havolasi emailingizga yuborildi' }
  }

  async resetPassword(token: string, newPassword: string) {
    if (newPassword.length < 8) {
      throw new BadRequestException("Parol kamida 8 ta belgidan iborat bo'lishi kerak")
    }

    const user = await this.prisma.user.findFirst({
      where: { resetToken: token, resetTokenExp: { gt: new Date() } }
    })

    if (!user) {
      throw new BadRequestException("Token yaroqsiz yoki muddati o'tgan")
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)

    await this.prisma.user.update({
      where: { id: user.id },
      data:  { passwordHash, resetToken: null, resetTokenExp: null }
    })

    await this.prisma.refreshToken.deleteMany({ where: { userId: user.id } })

    return { message: 'Parol muvaffaqiyatli yangilandi' }
  }

  // ============================================
  // EMAIL TASDIQLASH
  // ============================================
  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { verifyToken: token }
    })

    if (!user) {
      throw new BadRequestException('Token yaroqsiz')
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data:  { isVerified: true, verifyToken: null }
    })

    return { message: 'Email muvaffaqiyatli tasdiqlandi' }
  }

  // ============================================
  // JORIY FOYDALANUVCHI
  // ============================================
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where:   { id: userId },
      include: { subscription: true }
    })

    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi')

    const { passwordHash, resetToken, verifyToken, ...safeUser } = user
    return safeUser
  }
}
