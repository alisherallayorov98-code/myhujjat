import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { AuditService }           from './audit.service'
import { CurrentUser }            from '../../common/decorators/current-user.decorator'
import { TenantAccessService }    from '../../common/services/tenant-access.service'

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly tenant:       TenantAccessService,
  ) {}

  @Get()
  async findAll(@CurrentUser() user: any, @Query() query: any) {
    await this.tenant.requireOrgAccess(user.sub, query.orgId)
    return this.auditService.findAll(query.orgId, {
      userId: query.userId,
      action: query.action,
      page:   query.page   ? Number(query.page)  : 1,
      limit:  query.limit  ? Number(query.limit) : 50,
    })
  }
}
