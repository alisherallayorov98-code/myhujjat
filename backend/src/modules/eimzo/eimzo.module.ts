import { Module }           from '@nestjs/common'
import { EimzoController } from './eimzo.controller'
import { EimzoService }    from './eimzo.service'

@Module({
  controllers: [EimzoController],
  providers:   [EimzoService],
  exports:     [EimzoService],
})
export class EimzoModule {}
