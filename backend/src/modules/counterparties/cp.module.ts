import { Module }                 from '@nestjs/common'
import { CounterpartiesController } from './cp.controller'
import { CounterpartiesService }  from './cp.service'
import { PrismaModule }           from '../prisma/prisma.module'

@Module({
  imports:     [PrismaModule],
  controllers: [CounterpartiesController],
  providers:   [CounterpartiesService],
  exports:     [CounterpartiesService],
})
export class CounterpartiesModule {}
