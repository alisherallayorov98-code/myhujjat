import { Module }                from '@nestjs/common'
import { PrismaModule }          from '../prisma/prisma.module'
import { ContractsModule }       from '../contracts/contracts.module'
import { CounterpartiesModule }  from '../counterparties/cp.module'
import { SubscriptionsModule }   from '../subscriptions/subscriptions.module'
import { AuditModule }           from '../audit/audit.module'
import { BulkSendService }       from './bulk-send.service'
import { BulkSendController }    from './bulk-send.controller'

@Module({
  imports: [
    PrismaModule,
    ContractsModule,
    CounterpartiesModule,
    SubscriptionsModule,
    AuditModule,
  ],
  providers:   [BulkSendService],
  controllers: [BulkSendController],
  exports:     [BulkSendService],
})
export class BulkSendModule {}
