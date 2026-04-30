import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { AuditService }           from './audit.service'

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.auditService.findAll(query.orgId, {
      userId: query.userId,
      action: query.action,
      page:   query.page   ? Number(query.page)  : 1,
      limit:  query.limit  ? Number(query.limit) : 50,
    })
  }
}
