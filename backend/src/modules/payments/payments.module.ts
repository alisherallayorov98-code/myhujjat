import { Module }             from '@nestjs/common'
import { PaymentsController } from './payments.controller'
import { ClickService }       from './click.service'
import { PaymeService }       from './payme.service'
import { SubscriptionsModule } from '../subscriptions/subscriptions.module'

@Module({
  imports:     [SubscriptionsModule],
  controllers: [PaymentsController],
  providers:   [ClickService, PaymeService],
})
export class PaymentsModule {}
