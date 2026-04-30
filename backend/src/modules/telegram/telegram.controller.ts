import { Controller, Get, Post, Delete } from '@nestjs/common'
import { TelegramService } from './telegram.service'
import { CurrentUser }     from '../../common/decorators/current-user.decorator'

@Controller('telegram')
export class TelegramController {
  constructor(private readonly service: TelegramService) {}

  @Get('status')
  status(@CurrentUser() user: any) {
    return this.service.getStatus(user.sub)
  }

  @Post('link-code')
  generateLinkCode(@CurrentUser() user: any) {
    return this.service.generateLinkCode(user.sub).then(code => ({ code }))
  }

  @Delete('unlink')
  unlink(@CurrentUser() user: any) {
    return this.service.unlink(user.sub)
  }
}
