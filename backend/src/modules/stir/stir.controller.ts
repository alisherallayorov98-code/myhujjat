import { Controller, Get, Param } from '@nestjs/common'
import { StirService }            from './stir.service'
import { CurrentUser }            from '../../common/decorators/current-user.decorator'

@Controller('stir')
export class StirController {
  constructor(private readonly stirService: StirService) {}

  @Get(':inn')
  getCompany(@CurrentUser() user: any, @Param('inn') inn: string) {
    return this.stirService.getCompanyByInn(inn, user.sub)
  }

  @Get(':inn/founders')
  getFounders(@Param('inn') inn: string) {
    return this.stirService.getFounders(inn)
  }

  @Get('pinfl/:pinfl')
  checkPinfl(@Param('pinfl') pinfl: string) {
    return this.stirService.checkPinfl(pinfl)
  }
}
