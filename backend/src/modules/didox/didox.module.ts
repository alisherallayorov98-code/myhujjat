import { Module }              from '@nestjs/common'
import { DidoxController }     from './didox.controller'
import { DidoxService }        from './didox.service'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports:     [NotificationsModule],
  controllers: [DidoxController],
  providers:   [DidoxService],
  exports:     [DidoxService],
})
export class DidoxModule {}
