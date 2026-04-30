import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query,
} from '@nestjs/common'
import { TemplatesService, CreateTemplateDto, UpdateTemplateDto } from './templates.service'

@Controller('templates')
export class TemplatesController {
  constructor(private readonly svc: TemplatesService) {}

  @Get('seed')
  seed() {
    return this.svc.seedSystemTemplates()
  }

  @Get()
  findAll(
    @Query('orgId')        orgId: string,
    @Query('contractType') contractType?: string,
  ) {
    return this.svc.findAll(orgId, contractType)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateTemplateDto) {
    return this.svc.create(dto)
  }

  @Put(':id')
  update(
    @Param('id')    id: string,
    @Query('orgId') orgId: string,
    @Body()         dto: UpdateTemplateDto,
  ) {
    return this.svc.update(id, orgId, dto)
  }

  @Delete(':id')
  remove(
    @Param('id')    id: string,
    @Query('orgId') orgId: string,
  ) {
    return this.svc.remove(id, orgId)
  }
}
