import { Module }              from '@nestjs/common'
import { ContractsController } from './contracts.controller'
import { ContractsService }    from './contracts.service'
import { SubscriptionsModule } from '../subscriptions/subscriptions.module'
import { AuditModule }         from '../audit/audit.module'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports:     [SubscriptionsModule, AuditModule, NotificationsModule],
  controllers: [ContractsController],
  providers:   [ContractsService],
  exports:     [ContractsService],
})
export class ContractsModule {}
