import { Module } from '@nestjs/common'
import { UserTemplatesController } from './user-templates.controller'
import { UserTemplatesService } from './user-templates.service'

@Module({
  controllers: [UserTemplatesController],
  providers:   [UserTemplatesService],
  exports:     [UserTemplatesService],
})
export class UserTemplatesModule {}
