import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, HttpCode, HttpStatus
} from '@nestjs/common'
import { CounterpartiesService, CreateCpDto } from './cp.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@Controller('counterparties')
export class CounterpartiesController {
  constructor(private readonly cpService: CounterpartiesService) {}

  @Get()
  findAll(
    @Query('orgId')  orgId:  string,
    @Query('page')   page?:  string,
    @Query('limit')  limit?: string,
    @Query('search') search?: string,
  ) {
    return this.cpService.findAll(orgId, {
      page:   page  ? Number(page)  : 1,
      limit:  limit ? Number(limit) : 20,
      search,
    })
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cpService.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateCpDto) {
    return this.cpService.create(dto)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateCpDto>) {
    return this.cpService.update(id, dto)
  }

  @Put(':id/stir-status')
  updateStirStatus(
    @Param('id') id: string,
    @Body('status') status: string
  ) {
    return this.cpService.updateStirStatus(id, status)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.cpService.remove(id)
  }
}
