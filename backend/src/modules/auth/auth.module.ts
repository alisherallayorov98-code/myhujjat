import { Module }         from '@nestjs/common'
import { JwtModule }      from '@nestjs/jwt'
import { AuthService }    from './auth.service'
import { AuthController } from './auth.controller'
import { EimzoService }   from './e-imzo.service'
import { SessionsService }    from './sessions.service'
import { SessionsController } from './sessions.controller'
import { TwoFactorService }    from './two-factor.service'
import { TwoFactorController } from './two-factor.controller'
import { PrismaModule }        from '../prisma/prisma.module'
import { MailModule }          from '../mail/mail.module'
import { AuditModule }         from '../audit/audit.module'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [
    PrismaModule,
    MailModule,
    AuditModule,
    NotificationsModule,
    JwtModule.register({
      secret:      process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController, SessionsController, TwoFactorController],
  providers:   [AuthService, SessionsService, TwoFactorService, EimzoService],
  exports:     [AuthService, JwtModule],
})
export class AuthModule {}
