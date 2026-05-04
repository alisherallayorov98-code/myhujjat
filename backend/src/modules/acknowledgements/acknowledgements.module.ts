import { Module } from '@nestjs/common'
import { AcknowledgementsController } from './acknowledgements.controller'
import { AcknowledgementsService } from './acknowledgements.service'

@Module({
  controllers: [AcknowledgementsController],
  providers:   [AcknowledgementsService],
  exports:     [AcknowledgementsService],
})
export class AcknowledgementsModule {}
