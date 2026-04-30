import {
  Controller, Get, Post, Body, Param,
} from '@nestjs/common'
import { EimzoService }  from './eimzo.service'
import { PrismaService } from '../prisma/prisma.service'

@Controller('eimzo')
export class EimzoController {
  constructor(
    private readonly eimzoService: EimzoService,
    private readonly prisma:       PrismaService,
  ) {}

  @Get('challenge')
  getChallenge() {
    return this.eimzoService.createChallenge()
  }

  @Post('verify/:contractId')
  async verifyAndSign(
    @Param('contractId') contractId: string,
    @Body() body: {
      challengeId: string
      signature:   string
      certificate: string
      signerType:  'us' | 'cp'
    },
  ) {
    const result = this.eimzoService.verifySignature({
      challengeId: body.challengeId,
      signature:   body.signature,
      certificate: body.certificate,
    })

    if (!result.valid) {
      return { success: false, message: 'Imzo yaroqsiz' }
    }

    const updateData = body.signerType === 'us'
      ? { signedUs: true, signedUsAt: new Date() }
      : { signedCp: true, signedCpAt: new Date() }

    await this.prisma.contract.update({
      where: { id: contractId },
      data:  updateData,
    })

    return {
      success:  true,
      signer:   result.subject?.CN || result.subject?.SERIALNUMBER,
      signedAt: new Date(),
    }
  }
}
