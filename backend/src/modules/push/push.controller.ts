import { Controller, Get, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common'
import { PushService, PushSubscriptionDto } from './push.service'
import { CurrentUser }                       from '../../common/decorators/current-user.decorator'
import { Public }                            from '../../common/decorators/public.decorator'

@Controller('push')
export class PushController {
  constructor(private readonly push: PushService) {}

  @Public()
  @Get('public-key')
  getPublicKey() {
    return { key: this.push.getPublicKey() }
  }

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  subscribe(
    @CurrentUser()              user:     any,
    @Body()                     sub:      PushSubscriptionDto,
    @Headers('user-agent')      ua?:      string,
  ) {
    return this.push.subscribe(user.sub, sub, ua)
  }

  @Post('unsubscribe')
  @HttpCode(HttpStatus.OK)
  unsubscribe(@Body('endpoint') endpoint: string) {
    return this.push.unsubscribe(endpoint)
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  testNotification(@CurrentUser() user: any) {
    return this.push.sendToUser(user.sub, {
      title: 'MyHujjat.uz',
      body:  'Push bildirishnomalar ishlayapti ✓',
      url:   '/dashboard',
    })
  }
}
