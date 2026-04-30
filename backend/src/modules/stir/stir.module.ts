import { Module }        from '@nestjs/common'
import { StirController } from './stir.controller'
import { StirService }   from './stir.service'

@Module({
  controllers: [StirController],
  providers:   [StirService],
  exports:     [StirService],
})
export class StirModule {}
