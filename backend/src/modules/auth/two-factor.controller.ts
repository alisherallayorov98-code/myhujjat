import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { TwoFactorService } from './two-factor.service'
import { CurrentUser }      from '../../common/decorators/current-user.decorator'

@Controller('auth/2fa')
export class TwoFactorController {
  constructor(private readonly tfa: TwoFactorService) {}

  @Get('status')
  status(@CurrentUser() user: any) {
    return this.tfa.getStatus(user.sub)
  }

  @Post('setup')
  @HttpCode(HttpStatus.OK)
  setup(@CurrentUser() user: any) {
    return this.tfa.setup(user.sub)
  }

  @Post('enable')
  @HttpCode(HttpStatus.OK)
  enable(@CurrentUser() user: any, @Body('code') code: string) {
    return this.tfa.enable(user.sub, code)
  }

  @Post('disable')
  @HttpCode(HttpStatus.OK)
  disable(@CurrentUser() user: any, @Body('code') code: string) {
    return this.tfa.disable(user.sub, code)
  }

  @Post('regenerate-codes')
  @HttpCode(HttpStatus.OK)
  regenerate(@CurrentUser() user: any) {
    return this.tfa.regenerateBackupCodes(user.sub)
  }
}
