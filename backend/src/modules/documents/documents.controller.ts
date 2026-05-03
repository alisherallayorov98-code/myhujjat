import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query,
} from '@nestjs/common'
import { DocumentsService, CreateDocDto, UpdateDocDto } from './documents.service'
import { DocumentType } from '@prisma/client'

@Controller('documents')
export class DocumentsController {
  constructor(private readonly svc: DocumentsService) {}

  // ── SEIF routes (must be before /:id) ───────────────────────────────────

  @Get('seif/stats')
  getSeifStats(@Query('orgId') orgId: string) {
    return this.svc.getSeifStats(orgId)
  }

  @Get('seif')
  findSeif(@Query() query: any) {
    return this.svc.findSeif(query.orgId, {
      search: query.search,
      type:   query.type,
      page:   query.page  ? parseInt(query.page)  : 1,
      limit:  query.limit ? parseInt(query.limit) : 30,
    })
  }

  // ── CRUD routes ──────────────────────────────────────────────────────────

  @Get()
  findAll(
    @Query('orgId') orgId:  string,
    @Query('type')  type?:  DocumentType,
    @Query('page')  page?:  string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.findAll(orgId, {
      type,
      page:  page  ? Number(page)  : 1,
      limit: limit ? Number(limit) : 30,
    })
  }

  @Get(':id')
  findOne(
    @Query('orgId') orgId: string,
    @Param('id')    id: string,
  ) {
    return this.svc.findOne(orgId, id)
  }

  @Post()
  create(@Body() dto: CreateDocDto) {
    return this.svc.create(dto)
  }

  @Put(':id')
  update(
    @Query('orgId') orgId: string,
    @Param('id')    id: string,
    @Body()         dto: UpdateDocDto,
  ) {
    return this.svc.update(orgId, id, dto)
  }

  @Delete(':id')
  remove(
    @Query('orgId') orgId: string,
    @Param('id')    id: string,
  ) {
    return this.svc.remove(orgId, id)
  }
}
