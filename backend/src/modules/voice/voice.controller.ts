import {
  Controller, Post, Body, BadRequestException,
} from '@nestjs/common'
import { VoiceService }       from './voice.service'
import { CurrentUser }        from '../../common/decorators/current-user.decorator'
import { PrismaService }      from '../prisma/prisma.service'
import { TenantAccessService } from '../../common/services/tenant-access.service'
import { VoiceCommandDto }    from './dto/voice-command.dto'

@Controller('voice')
export class VoiceController {
  constructor(
    private readonly voiceService: VoiceService,
    private readonly prisma:       PrismaService,
    private readonly tenant:       TenantAccessService,
  ) {}

  /**
   * POST /voice/command
   */
  @Post('command')
  async command(
    @CurrentUser() user: any,
    @Body() body: VoiceCommandDto,
  ) {
    if (!body.text && !body.audio?.data) {
      throw new BadRequestException("Buyruq matni yoki audio kerak")
    }

    // Foydalanuvchining default tashkiloti
    let orgId = body.orgId
    if (!orgId) {
      // orgId yuborilmagan — foydalanuvchining default tashkilotini topamiz
      const accessibleIds = await this.tenant.getAccessibleOrgIds(user.sub)
      if (accessibleIds.length === 0) {
        throw new BadRequestException('Avval tashkilot qo\'shing')
      }
      const defaultOrg = await this.prisma.organization.findFirst({
        where: { id: { in: accessibleIds }, isDefault: true, isActive: true },
      })
      const anyOrg = defaultOrg || await this.prisma.organization.findFirst({
        where: { id: { in: accessibleIds }, isActive: true },
      })
      if (!anyOrg) {
        throw new BadRequestException('Avval tashkilot qo\'shing')
      }
      orgId = anyOrg.id
    } else {
      // orgId yuborilgan — tashkilotga ruxsati borligini tekshirish (multi-tenant guard)
      await this.tenant.requireOrgAccess(user.sub, orgId)
    }

    return this.voiceService.processCommand({
      text:       body.text,
      audio:      body.audio,
      targetLang: body.targetLang,
      state:      (body.state as any) || null,
      testMode:   body.testMode,
      context:    { userId: user.sub, organizationId: orgId },
    })
  }
}
