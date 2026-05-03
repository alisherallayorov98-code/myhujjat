import {
  Injectable, CanActivate,
  ExecutionContext, UnauthorizedException,
  OnModuleInit,
} from '@nestjs/common'
import { Reflector }     from '@nestjs/core'
import { JwtService }    from '@nestjs/jwt'
import { PrismaService } from '../../modules/prisma/prisma.service'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'

// 5 daqiqalik in-memory cache: {userId → expiry timestamp}
// O'chirilgan akkountlar 5 daqiqa ichida tizimdan butunlay chiqadi
const userValidCache = new Map<string, number>()
const CACHE_TTL_MS   = 5 * 60 * 1000

@Injectable()
export class JwtAuthGuard implements CanActivate, OnModuleInit {
  private cleanupInterval?: NodeJS.Timeout

  constructor(
    private jwtService: JwtService,
    private reflector:  Reflector,
    private prisma:     PrismaService,
  ) {}

  onModuleInit() {
    // Har 10 daqiqada eskirgan cache entry'larni o'chirish
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [k, exp] of userValidCache.entries()) {
        if (exp < now) userValidCache.delete(k)
      }
    }, 10 * 60 * 1000)
    if (this.cleanupInterval.unref) this.cleanupInterval.unref()
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()]
    )
    if (isPublic) return true

    const request = context.switchToHttp().getRequest()
    const token   = this.extractToken(request)
    if (!token) throw new UnauthorizedException('Token topilmadi')

    let payload: any
    try {
      payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET })
    } catch {
      throw new UnauthorizedException('Token yaroqsiz')
    }

    // User mavjudligini tekshirish (5 daqiqalik cache bilan)
    const cachedExpiry = userValidCache.get(payload.sub)
    if (!cachedExpiry || cachedExpiry < Date.now()) {
      const user = await this.prisma.user.findUnique({
        where:  { id: payload.sub },
        select: { id: true, isActive: true },
      })
      if (!user || !user.isActive) {
        userValidCache.delete(payload.sub)
        throw new UnauthorizedException('Akkount topilmadi yoki o\'chirilgan')
      }
      userValidCache.set(payload.sub, Date.now() + CACHE_TTL_MS)
    }

    request.user = payload
    return true
  }

  private extractToken(request: any): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : null
  }
}

// Token bekor qilinganda cache'dan ham o'chirish (logout, account delete)
export function invalidateUserCache(userId: string) {
  userValidCache.delete(userId)
}
