import { Module } from '@nestjs/common'
import { VoiceService }    from './voice.service'
import { VoiceController } from './voice.controller'
import { PrismaModule }            from '../prisma/prisma.module'
import { CounterpartiesModule }    from '../counterparties/cp.module'
import { ContractsModule }         from '../contracts/contracts.module'
import { StirModule }              from '../stir/stir.module'
import { MiraModule }              from '../mira/mira.module'

@Module({
  imports:     [PrismaModule, CounterpartiesModule, ContractsModule, StirModule, MiraModule],
  providers:   [VoiceService],
  controllers: [VoiceController],
})
export class VoiceModule {}
