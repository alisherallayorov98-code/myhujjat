import {
  Injectable, CanActivate,
  ExecutionContext, UnauthorizedException
} from '@nestjs/common'
import { Reflector }     from '@nestjs/core'
import { JwtService }    from '@nestjs/jwt'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector:  Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()]
    )
    if (isPublic) return true

    const request = context.switchToHttp().getRequest()
    const token   = this.extractToken(request)
    if (!token) throw new UnauthorizedException('Token topilmadi')

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      })
      request.user = payload
      return true
    } catch {
      throw new UnauthorizedException('Token yaroqsiz')
    }
  }

  private extractToken(request: any): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : null
  }
}
