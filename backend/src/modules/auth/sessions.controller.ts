import { Controller, Get, Delete, Param, Req, HttpCode, HttpStatus } from '@nestjs/common'
import { Request } from 'express'
import { SessionsService } from './sessions.service'
import { CurrentUser }     from '../../common/decorators/current-user.decorator'

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Get()
  list(@CurrentUser() user: any, @Req() req: Request) {
    const currentToken = req.cookies?.refresh_token
    return this.sessions.list(user.sub, currentToken)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  revoke(@CurrentUser() user: any, @Param('id') id: string) {
    return this.sessions.revoke(user.sub, id)
  }

  @Delete('all/except-current')
  @HttpCode(HttpStatus.OK)
  revokeAll(@CurrentUser() user: any, @Req() req: Request) {
    const currentToken = req.cookies?.refresh_token
    return this.sessions.revokeAllExceptCurrent(user.sub, currentToken)
  }
}
