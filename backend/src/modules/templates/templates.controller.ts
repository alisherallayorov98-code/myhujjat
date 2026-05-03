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
    @Query('orgId')        orgId:        string,
    @Query('contractType') contractType?: string,
    @Query('search')       search?:      string,
    @Query('page')         page?:        string,
    @Query('limit')        limit?:       string,
  ) {
    return this.svc.findAll(orgId, {
      contractType,
      search,
      page:  page  ? Number(page)  : 1,
      limit: limit ? Number(limit) : 30,
    })
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
