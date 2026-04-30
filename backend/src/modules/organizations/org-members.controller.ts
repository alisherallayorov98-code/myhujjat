import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common'
import { ApiBearerAuth, ApiTags }                          from '@nestjs/swagger'
import { OrgMembersService }                               from './org-members.service'
import { CurrentUser }                                     from '../../common/decorators/current-user.decorator'

@ApiTags('OrgMembers')
@ApiBearerAuth()
@Controller('orgs')
export class OrgMembersController {
  constructor(private readonly service: OrgMembersService) {}

  // Invite orqali qo'shilish — static route first
  @Post('join')
  joinByInvite(@CurrentUser() user: any, @Body('token') token: string) {
    return this.service.joinByInvite(user.sub, token)
  }

  @Get(':orgId/members')
  getMembers(@Param('orgId') orgId: string) {
    return this.service.getMembers(orgId)
  }

  @Post(':orgId/members/invite')
  createInvite(@Param('orgId') orgId: string, @Body('role') role: string) {
    return this.service.createInvite(orgId, role || 'MEMBER')
  }

  @Put(':orgId/members/:memberId/role')
  changeRole(@Param('memberId') id: string, @Body('role') role: string) {
    return this.service.changeRole(id, role)
  }

  @Delete(':orgId/members/:memberId')
  remove(@Param('memberId') id: string) {
    return this.service.removeMember(id)
  }
}
