import {
  Controller, Get, Post, Put, Delete,
  Body, Param, HttpCode, HttpStatus
} from '@nestjs/common'
import { OrgsService, CreateOrgDto } from './orgs.service'
import { CurrentUser }               from '../../common/decorators/current-user.decorator'

@Controller('organizations')
export class OrgsController {
  constructor(private readonly orgsService: OrgsService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.orgsService.findAll(user.sub)
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.orgsService.findOne(user.sub, id)
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateOrgDto) {
    return this.orgsService.create(user.sub, dto)
  }

  @Put(':id')
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: Partial<CreateOrgDto>
  ) {
    return this.orgsService.update(user.sub, id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.orgsService.remove(user.sub, id)
  }

  @Put(':id/set-default')
  setDefault(@CurrentUser() user: any, @Param('id') id: string) {
    return this.orgsService.setDefault(user.sub, id)
  }

  @Post(':id/bank-accounts')
  addBankAccount(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: { bankName: string; accountNumber: string; mfo: string; isDefault?: boolean }
  ) {
    return this.orgsService.addBankAccount(user.sub, id, dto)
  }
}
