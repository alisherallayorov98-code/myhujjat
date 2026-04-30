import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common'
import { ContractsService, CreateContractDto } from './contracts.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { TenantRateLimitGuard, TenantLimit } from '../../common/guards/tenant-rate-limit.guard'

@Controller('contracts')
@UseGuards(TenantRateLimitGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get('stats/:orgId')
  getStats(@Param('orgId') orgId: string) {
    return this.contractsService.getStats(orgId)
  }

  @Get()
  findAll(@Query() query: any) {
    const page  = query.page  ? parseInt(query.page)  : 1
    const limit = query.limit ? parseInt(query.limit) : 20
    return this.contractsService.findAll(query.orgId, { ...query, page, limit })
  }

  @Get(':id')
  findOne(@Query('orgId') orgId: string, @Param('id') id: string) {
    return this.contractsService.findOne(orgId, id)
  }

  @Post()
  @TenantLimit({ limit: 30, windowMs: 60_000 })  // 1 daqiqada max 30 ta shartnoma yaratish
  create(@CurrentUser() user: any, @Body() dto: CreateContractDto) {
    return this.contractsService.create(user.sub, dto)
  }

  @Put(':id')
  update(
    @Query('orgId') orgId: string,
    @Param('id')    id:    string,
    @Body()         dto:   Partial<CreateContractDto>,
  ) {
    return this.contractsService.update(orgId, id, dto)
  }

  @Put(':id/status')
  updateStatus(
    @Query('orgId') orgId:  string,
    @Param('id')    id:     string,
    @Body('status') status: string,
  ) {
    return this.contractsService.updateStatus(orgId, id, status)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Query('orgId') orgId: string, @Param('id') id: string) {
    return this.contractsService.remove(orgId, id)
  }
}
