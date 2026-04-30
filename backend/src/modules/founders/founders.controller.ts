import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags }                                  from '@nestjs/swagger'
import { FoundersService }                                         from './founders.service'

@ApiTags('Founders')
@ApiBearerAuth()
@Controller('founders')
export class FoundersController {
  constructor(private readonly foundersService: FoundersService) {}

  @Get()
  findAll(@Query('orgId') orgId: string) {
    return this.foundersService.findAll(orgId)
  }

  @Post()
  create(@Query('orgId') orgId: string, @Body() dto: any) {
    return this.foundersService.create(orgId, dto)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.foundersService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.foundersService.remove(id)
  }
}
