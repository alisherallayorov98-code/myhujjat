import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common'
import { ApiBearerAuth, ApiTags }                          from '@nestjs/swagger'
import { OrgMembersService }                               from './org-members.service'
import { CurrentUser }                                     from '../../common/decorators/current-user.decorator'
import { TenantAccessService }                             from '../../common/services/tenant-access.service'

@ApiTags('OrgMembers')
@ApiBearerAuth()
@Controller('orgs')
export class OrgMembersController {
  constructor(
    private readonly service: OrgMembersService,
    private readonly tenant:  TenantAccessService,
  ) {}

  // Invite orqali qo'shilish — static route first (token o'zi auth qiladi)
  @Post('join')
  joinByInvite(@CurrentUser() user: any, @Body('token') token: string) {
    return this.service.joinByInvite(user.sub, token)
  }

  // Faqat tashkilot a'zolari ro'yxatni ko'ra oladi
  @Get(':orgId/members')
  async getMembers(@CurrentUser() user: any, @Param('orgId') orgId: string) {
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.service.getMembers(orgId)
  }

  // Faqat OWNER taklif yarata oladi
  @Post(':orgId/members/invite')
  async createInvite(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Body('role') role: string,
  ) {
    await this.tenant.requireOwner(user.sub, orgId)
    return this.service.createInvite(orgId, role || 'MEMBER')
  }

  // Faqat OWNER rolni o'zgartira oladi
  @Put(':orgId/members/:memberId/role')
  async changeRole(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Param('memberId') id: string,
    @Body('role') role: string,
  ) {
    await this.tenant.requireOwner(user.sub, orgId)
    return this.service.changeRole(id, role)
  }

  // Faqat OWNER a'zolarni o'chira oladi
  @Delete(':orgId/members/:memberId')
  async remove(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Param('memberId') id: string,
  ) {
    await this.tenant.requireOwner(user.sub, orgId)
    return this.service.removeMember(id)
  }

  // Faqat OWNER egalikni boshqa a'zoga o'tkaza oladi
  @Post(':orgId/members/transfer-owner')
  async transferOwner(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Body('userId') newOwnerUserId: string,
  ) {
    await this.tenant.requireOwner(user.sub, orgId)
    return this.service.transferOwnership(orgId, newOwnerUserId)
  }
}
