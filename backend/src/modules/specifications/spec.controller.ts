import {
  Controller, Get, Post, Put,
  Delete, Body, Param, Query, HttpCode,
} from '@nestjs/common'
import { SpecService } from './spec.service'

@Controller('specifications')
export class SpecController {
  constructor(private readonly specService: SpecService) {}

  @Get()
  findAll(@Query('orgId') orgId: string) {
    return this.specService.findAll(orgId)
  }

  @Get(':id')
  findOne(@Query('orgId') orgId: string, @Param('id') id: string) {
    return this.specService.findOne(orgId, id)
  }

  @Post()
  create(@Body() dto: any) {
    return this.specService.create(dto)
  }

  @Put(':id')
  update(
    @Query('orgId') orgId: string,
    @Param('id')    id:    string,
    @Body()         dto:   any,
  ) {
    return this.specService.update(orgId, id, dto)
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Query('orgId') orgId: string, @Param('id') id: string) {
    return this.specService.remove(orgId, id)
  }
}
