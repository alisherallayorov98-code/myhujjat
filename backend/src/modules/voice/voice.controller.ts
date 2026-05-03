import {
  Controller, Post, Body, BadRequestException,
} from '@nestjs/common'
import { VoiceService }     from './voice.service'
import { CurrentUser }      from '../../common/decorators/current-user.decorator'
import { PrismaService }    from '../prisma/prisma.service'
import { VoiceCommandDto }  from './dto/voice-command.dto'

@Controller('voice')
export class VoiceController {
  constructor(
    private readonly voiceService: VoiceService,
    private readonly prisma:       PrismaService,
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
      const defaultOrg = await this.prisma.organization.findFirst({
        where:   { userId: user.sub, isDefault: true },
      })
      const anyOrg = defaultOrg || await this.prisma.organization.findFirst({
        where: { userId: user.sub },
      })
      if (!anyOrg) {
        throw new BadRequestException('Avval tashkilot qo\'shing')
      }
      orgId = anyOrg.id
    }

    return this.voiceService.processCommand({
      text:       body.text,
      audio:      body.audio,
      targetLang: body.targetLang,
      state:      (body.state as any) || null,
      context:    { userId: user.sub, organizationId: orgId },
    })
  }
}
