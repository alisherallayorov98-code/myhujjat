import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common'
import { ApiBearerAuth, ApiTags }                  from '@nestjs/swagger'
import { SupportService }                          from './support.service'
import { CurrentUser }                             from '../../common/decorators/current-user.decorator'

@ApiTags('Support')
@ApiBearerAuth()
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('my')
  getMyMessages(@CurrentUser() user: any) {
    return this.supportService.getMessages(user.sub)
  }

  @Post('my/send')
  sendMessage(
    @CurrentUser() user: any,
    @Body('content') content: string,
  ) {
    return this.supportService.sendMessage(user.sub, content)
  }

  // Admin endpoints (used by admin panel)
  @Get('sessions')
  getAllOpen() {
    return this.supportService.getAllOpen()
  }

  @Get('sessions/:id/messages')
  getSessionMessages(@Param('id') id: string) {
    return this.supportService.getSessionMessages(id)
  }

  @Post('sessions/:id/reply')
  adminReply(
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    return this.supportService.adminReply(id, content)
  }

  @Put('sessions/:id/close')
  closeSession(@Param('id') id: string) {
    return this.supportService.closeSession(id)
  }
}
