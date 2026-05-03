import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { SearchService }          from './search.service'
import { CurrentUser }            from '../../common/decorators/current-user.decorator'
import { TenantAccessService }    from '../../common/services/tenant-access.service'

@ApiTags('Search')
@ApiBearerAuth()
@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly tenant:        TenantAccessService,
  ) {}

  @Get()
  async search(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Query('q')     q:     string,
  ) {
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.searchService.search(orgId, q)
  }
}
