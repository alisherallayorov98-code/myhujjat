import { Module, forwardRef } from '@nestjs/common'
import { NotificationsService }    from './notifications.service'
import { NotificationsController } from './notifications.controller'
import { NotificationsCron }       from './notifications.cron'
import { PrismaModule }            from '../prisma/prisma.module'
import { MailModule }              from '../mail/mail.module'
import { PushModule }              from '../push/push.module'

@Module({
  imports:     [PrismaModule, MailModule, forwardRef(() => PushModule)],
  providers:   [NotificationsService, NotificationsCron],
  controllers: [NotificationsController],
  exports:     [NotificationsService],
})
export class NotificationsModule {}
