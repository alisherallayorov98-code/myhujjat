import { Module }             from '@nestjs/common'
import { PaymentsController } from './payments.controller'
import { ClickService }       from './click.service'
import { PaymeService }       from './payme.service'
import { PrismaModule }       from '../prisma/prisma.module'
import { SubscriptionsModule } from '../subscriptions/subscriptions.module'

@Module({
  imports:     [PrismaModule, SubscriptionsModule],
  controllers: [PaymentsController],
  providers:   [ClickService, PaymeService],
})
export class PaymentsModule {}
