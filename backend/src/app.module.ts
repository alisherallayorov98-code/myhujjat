import { Module }                  from '@nestjs/common'
import { ConfigModule }            from '@nestjs/config'
import { APP_GUARD }               from '@nestjs/core'
import { JwtModule }               from '@nestjs/jwt'
import { ScheduleModule }          from '@nestjs/schedule'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { PrismaModule }            from './modules/prisma/prisma.module'
import { AuthModule }              from './modules/auth/auth.module'
import { UsersModule }             from './modules/users/users.module'
import { OrgsModule }              from './modules/organizations/orgs.module'
import { StirModule }              from './modules/stir/stir.module'
import { CounterpartiesModule }    from './modules/counterparties/cp.module'
import { SubscriptionsModule }     from './modules/subscriptions/subscriptions.module'
import { PaymentsModule }          from './modules/payments/payments.module'
import { ContractsModule }         from './modules/contracts/contracts.module'
import { SpecModule }              from './modules/specifications/spec.module'
import { AiModule }                from './modules/ai/ai.module'
import { DocumentsModule }         from './modules/documents/documents.module'
import { EmployeesModule }         from './modules/employees/employees.module'
import { TemplatesModule }         from './modules/templates/templates.module'
import { EimzoModule }             from './modules/eimzo/eimzo.module'
import { DidoxModule }             from './modules/didox/didox.module'
import { AdminModule }             from './modules/admin/admin.module'
import { SearchModule }            from './modules/search/search.module'
import { AuditModule }             from './modules/audit/audit.module'
import { SupportModule }           from './modules/support/support.module'
import { FoundersModule }          from './modules/founders/founders.module'
import { NotificationsModule }     from './modules/notifications/notifications.module'
import { VoiceModule }             from './modules/voice/voice.module'
import { ShareLinksModule }        from './modules/share-links/share-links.module'
import { TelegramModule }          from './modules/telegram/telegram.module'
import { InvoicesModule }          from './modules/invoices/invoices.module'
import { HealthModule }            from './modules/health/health.module'
import { PushModule }              from './modules/push/push.module'
import { CommonModule }            from './common/common.module'
import { JwtAuthGuard }            from './common/guards/jwt-auth.guard'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({ global: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      // Tezkor: 1 soniyada max 10 ta so'rov (DDoS oldini olish)
      { name: 'short', ttl: 1000,    limit: 10 },
      // O'rta: 1 daqiqada max 100 ta so'rov
      { name: 'medium', ttl: 60_000, limit: 100 },
      // Uzun: 1 soatda max 1000 ta so'rov (bot'lar uchun)
      { name: 'long', ttl: 60 * 60_000, limit: 1000 },
    ]),
    PrismaModule,
    CommonModule,    // Global — TenantAccessService, CryptoService
    AuthModule,
    UsersModule,
    OrgsModule,
    StirModule,
    CounterpartiesModule,
    SubscriptionsModule,
    PaymentsModule,
    ContractsModule,
    SpecModule,
    AiModule,
    DocumentsModule,
    EmployeesModule,
    TemplatesModule,
    EimzoModule,
    DidoxModule,
    AdminModule,
    SearchModule,
    AuditModule,
    SupportModule,
    FoundersModule,
    NotificationsModule,
    VoiceModule,
    ShareLinksModule,
    TelegramModule,
    InvoicesModule,
    HealthModule,
    PushModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
