import {
  Controller, Get, Put, Delete,
  Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: any, @Query() query: any) {
    return this.service.findAll(user.sub, query)
  }

  @Put(':id/read')
  markRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.markRead(user.sub, id)
  }

  @Put('read-all')
  markAllRead(@CurrentUser() user: any) {
    return this.service.markAllRead(user.sub)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.remove(user.sub, id)
  }
}
