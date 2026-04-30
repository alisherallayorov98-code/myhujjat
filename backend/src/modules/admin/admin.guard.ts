import {
  Injectable, CanActivate,
  ExecutionContext, ForbiddenException,
} from '@nestjs/common'

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const user    = request.user

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new ForbiddenException('Admin ruxsati yo\'q')
    }

    return true
  }
}
