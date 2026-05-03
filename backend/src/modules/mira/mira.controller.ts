import {
  Controller, Get, Patch, Body, BadRequestException,
} from '@nestjs/common'
import { MiraService, type MiraSettingsDto } from './mira.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { PrismaService } from '../prisma/prisma.service'

@Controller('mira')
export class MiraController {
  constructor(
    private readonly mira:   MiraService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * GET /mira/settings — joriy sozlamalar (yoki default)
   */
  @Get('settings')
  async getSettings(@CurrentUser() user: any) {
    const orgId = await this.resolveOrgId(user.sub)
    return this.mira.getOrCreate(user.sub, orgId)
  }

  /**
   * PATCH /mira/settings — sozlamalarni yangilash
   */
  @Patch('settings')
  async updateSettings(@CurrentUser() user: any, @Body() dto: MiraSettingsDto) {
    const orgId = await this.resolveOrgId(user.sub)
    // amount validatsiya
    if (dto.defaultAmount !== undefined && dto.defaultAmount < 0) {
      throw new BadRequestException("Summa manfiy bo'la olmaydi")
    }
    if (dto.confirmationThreshold !== undefined && dto.confirmationThreshold < 0) {
      throw new BadRequestException("Tasdiqlash chegarasi manfiy bo'la olmaydi")
    }
    if (dto.defaultPaymentDays !== undefined && dto.defaultPaymentDays < 0) {
      throw new BadRequestException("To'lov muddati manfiy bo'la olmaydi")
    }
    return this.mira.update(user.sub, orgId, dto)
  }

  private async resolveOrgId(userId: string): Promise<string> {
    const def = await this.prisma.organization.findFirst({
      where: { userId, isDefault: true },
    })
    const any = def || await this.prisma.organization.findFirst({
      where: { userId },
    })
    if (!any) throw new BadRequestException("Avval tashkilot qo'shing")
    return any.id
  }
}
