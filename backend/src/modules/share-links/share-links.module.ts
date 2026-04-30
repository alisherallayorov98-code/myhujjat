import { Module } from '@nestjs/common'
import { ShareLinksService }    from './share-links.service'
import { ShareLinksController } from './share-links.controller'
import { PrismaModule }            from '../prisma/prisma.module'
import { NotificationsModule }     from '../notifications/notifications.module'

@Module({
  imports:     [PrismaModule, NotificationsModule],
  providers:   [ShareLinksService],
  controllers: [ShareLinksController],
})
export class ShareLinksModule {}
