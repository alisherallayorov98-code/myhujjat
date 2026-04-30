import { Module } from '@nestjs/common'
import { TelegramService }    from './telegram.service'
import { TelegramController } from './telegram.controller'
import { PrismaModule }            from '../prisma/prisma.module'
import { ContractsModule }         from '../contracts/contracts.module'
import { StirModule }              from '../stir/stir.module'
import { CounterpartiesModule }    from '../counterparties/cp.module'

@Module({
  imports:     [PrismaModule, ContractsModule, StirModule, CounterpartiesModule],
  providers:   [TelegramService],
  controllers: [TelegramController],
  exports:     [TelegramService],
})
export class TelegramModule {}
