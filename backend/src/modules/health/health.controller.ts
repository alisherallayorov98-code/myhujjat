import { Controller, Get } from '@nestjs/common'
import { HealthService }   from './health.service'
import { Public }          from '../../common/decorators/public.decorator'

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /**
   * To'liq holat tekshiruvi — barcha komponentlar.
   * Public — uptime monitoring xizmatlari uchun.
   */
  @Public()
  @Get()
  async fullHealth() {
    return this.health.getFullHealth()
  }

  /**
   * Tezkor — server tirikmi yoki yo'qmi.
   * Load balancer uchun — kam ma'lumot, kam yuk.
   */
  @Public()
  @Get('quick')
  quickHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() }
  }

  /**
   * Faqat database — DB monitor uchun.
   */
  @Public()
  @Get('db')
  async dbHealth() {
    return this.health.checkDatabase()
  }
}
