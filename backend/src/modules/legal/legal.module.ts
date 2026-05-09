import { Module }          from '@nestjs/common'
import { LegalService }    from './legal.service'
import { LegalController } from './legal.controller'
import { CommonModule }    from '../../common/common.module'

@Module({
  imports:     [CommonModule],
  providers:   [LegalService],
  controllers: [LegalController],
})
export class LegalModule {}
