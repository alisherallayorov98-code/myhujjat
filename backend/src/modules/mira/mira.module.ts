import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { MiraService } from './mira.service'
import { MiraController } from './mira.controller'

@Module({
  imports:     [PrismaModule],
  providers:   [MiraService],
  controllers: [MiraController],
  exports:     [MiraService],
})
export class MiraModule {}
