import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common'
import { AdminService } from './admin.service'
import { AdminGuard }   from './admin.guard'

@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats()
  }

  @Get('users')
  getUsers(@Query() query: any) {
    return this.adminService.getUsers({
      search: query.search,
      plan:   query.plan,
      page:   query.page  ? parseInt(query.page)  : 1,
      limit:  query.limit ? parseInt(query.limit) : 20,
    })
  }

  @Put('users/:id/toggle-block')
  toggleBlock(
    @Param('id')    id:    string,
    @Body('block')  block: boolean,
  ) {
    return this.adminService.toggleUserBlock(id, block)
  }

  @Post('users/:id/grant-subscription')
  grantSub(
    @Param('id') id: string,
    @Body() body: { plan: string; months: number },
  ) {
    return this.adminService.grantSubscription(id, body.plan, body.months)
  }

  @Get('payments')
  getPayments(@Query('page') page?: string) {
    return this.adminService.getPayments(page ? parseInt(page) : 1)
  }

  @Get('announcements')
  getAnnouncements() {
    return this.adminService.getAnnouncements()
  }

  @Post('announcements')
  createAnnouncement(@Body() body: { title: string; content: string }) {
    return this.adminService.createAnnouncement(body)
  }

  @Delete('announcements/:id')
  deleteAnnouncement(@Param('id') id: string) {
    return this.adminService.deleteAnnouncement(id)
  }

  @Get('support')
  getSupportSessions() {
    return this.adminService.getSupportSessions()
  }

  @Post('support/:id/reply')
  replyToSupport(
    @Param('id')       id:      string,
    @Body('content')   content: string,
  ) {
    return this.adminService.replyToSupport(id, content)
  }

  @Put('support/:id/close')
  closeSupportSession(@Param('id') id: string) {
    return this.adminService.closeSupportSession(id)
  }

  @Get('audit')
  getAuditLogs(@Query() query: any) {
    return this.adminService.getAuditLogs({
      action: query.action,
      userId: query.userId,
      entity: query.entity,
      page:   query.page  ? parseInt(query.page)  : 1,
      limit:  query.limit ? parseInt(query.limit) : 50,
    })
  }

  @Get('organizations')
  getOrganizations(@Query() query: any) {
    return this.adminService.getOrganizations({
      search: query.search,
      page:   query.page  ? parseInt(query.page)  : 1,
      limit:  query.limit ? parseInt(query.limit) : 20,
    })
  }
}
