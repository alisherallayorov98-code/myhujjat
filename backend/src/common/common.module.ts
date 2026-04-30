import { Global, Module } from '@nestjs/common'
import { TenantAccessService } from './services/tenant-access.service'
import { CryptoService }       from './services/crypto.service'
import { PrismaModule }        from '../modules/prisma/prisma.module'

@Global()
@Module({
  imports:   [PrismaModule],
  providers: [TenantAccessService, CryptoService],
  exports:   [TenantAccessService, CryptoService],
})
export class CommonModule {}
