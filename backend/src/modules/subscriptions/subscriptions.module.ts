import { Module }              from '@nestjs/common'
import { SubscriptionService } from './subscription.service'
import { MailModule }          from '../mail/mail.module'

@Module({
  imports:   [MailModule],
  providers: [SubscriptionService],
  exports:   [SubscriptionService],
})
export class SubscriptionsModule {}
