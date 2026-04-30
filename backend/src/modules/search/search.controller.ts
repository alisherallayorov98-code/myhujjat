import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { SearchService }          from './search.service'

@ApiTags('Search')
@ApiBearerAuth()
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(
    @Query('orgId') orgId: string,
    @Query('q')     q:     string,
  ) {
    return this.searchService.search(orgId, q)
  }
}
