import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UnauthorizedException, BadRequestException,
} from '@nestjs/common'
import {
  UserTemplatesService,
  CreateUserTemplateDto, UpdateUserTemplateDto,
} from './user-templates.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { TenantAccessService } from '../../common/services/tenant-access.service'

@Controller('user-templates')
export class UserTemplatesController {
  constructor(
    private readonly svc:    UserTemplatesService,
    private readonly tenant: TenantAccessService,
  ) {}

  @Get()
  async list(
    @CurrentUser() user: any,
    @Query('orgId')  orgId:  string,
    @Query('search') search?: string,
    @Query('page')   page?:   string,
    @Query('limit')  limit?:  string,
  ) {
    if (!user?.sub) throw new UnauthorizedException()
    if (!orgId)     throw new BadRequestException('orgId kerak')
    await this.tenant.requireOrgAccess(user.sub, orgId)

    return this.svc.list(orgId, {
      search,
      page:  page  ? Number(page)  : 1,
      limit: limit ? Number(limit) : 30,
    })
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('orgId') orgId: string,
  ) {
    if (!user?.sub) throw new UnauthorizedException()
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.svc.findOne(id, orgId)
  }

  @Post()
  async create(
    @CurrentUser() user: any,
    @Body() dto: CreateUserTemplateDto,
  ) {
    if (!user?.sub) throw new UnauthorizedException()
    if (!dto.organizationId) throw new BadRequestException('organizationId kerak')
    await this.tenant.requireOrgAccess(user.sub, dto.organizationId)
    return this.svc.create(user.sub, dto)
  }

  @Post('clone/:baseId')
  async clone(
    @CurrentUser() user: any,
    @Param('baseId') baseId: string,
    @Body() body: { organizationId: string; name?: string },
  ) {
    if (!user?.sub) throw new UnauthorizedException()
    if (!body.organizationId) throw new BadRequestException('organizationId kerak')
    await this.tenant.requireOrgAccess(user.sub, body.organizationId)
    return this.svc.cloneFromSystem(user.sub, body.organizationId, baseId, body.name)
  }

  @Post('parse-text')
  parseText(@Body() body: { text: string }) {
    // Plain text'ni bloklarga ajratish (frontend block editor uchun)
    if (!body?.text || typeof body.text !== 'string') {
      throw new BadRequestException('text kerak')
    }
    return { blocks: this.svc.parseTextToBlocks(body.text) }
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('orgId') orgId: string,
    @Body() dto: UpdateUserTemplateDto,
  ) {
    if (!user?.sub) throw new UnauthorizedException()
    if (!orgId) throw new BadRequestException('orgId kerak')
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.svc.update(id, orgId, dto)
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('orgId') orgId: string,
  ) {
    if (!user?.sub) throw new UnauthorizedException()
    if (!orgId) throw new BadRequestException('orgId kerak')
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.svc.remove(id, orgId)
  }
}
