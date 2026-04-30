import { Controller, Put, Get, Post, Delete, Body, Param, Res, HttpCode, HttpStatus } from '@nestjs/common'
import type { Response } from 'express'
import { UsersService }                 from './users.service'
import { CurrentUser }                  from '../../common/decorators/current-user.decorator'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Put('profile')
  updateProfile(
    @CurrentUser() user: any,
    @Body() dto: {
      firstName?: string
      lastName?:  string
      phone?:     string
      language?:  string
      avatarUrl?: string
    },
  ) {
    return this.usersService.updateProfile(user.id, dto)
  }

  @Put('change-password')
  changePassword(
    @CurrentUser() user: any,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    return this.usersService.changePassword(user.id, body.oldPassword, body.newPassword)
  }

  @Put('organizations/:orgId')
  updateOrganization(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Body() dto: any,
  ) {
    return this.usersService.updateOrganization(orgId, user.id, dto)
  }

  // ─── GDPR ────────────────────────────────────────────────
  @Get('export-data')
  async exportData(@CurrentUser() user: any, @Res() res: Response) {
    const data = await this.usersService.exportData(user.sub)
    const filename = `myhujjat-data-${user.sub.slice(0, 8)}-${Date.now()}.json`
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(JSON.stringify(data, null, 2))
  }

  @Post('delete-account')
  @HttpCode(HttpStatus.OK)
  deleteAccount(
    @CurrentUser()           user: any,
    @Body('password')        password: string,
  ) {
    return this.usersService.deleteAccount(user.sub, password)
  }
}
