import { Module } from '@nestjs/common'
import { InvoicesService }          from './invoices.service'
import { DidoxService }             from './didox.service'
import { ContractMonitorService }   from './contract-monitor.service'
import { InvoicesCron }             from './invoices.cron'
import { InvoicesController, DidoxController } from './invoices.controller'
import { PrismaModule }             from '../prisma/prisma.module'
import { NotificationsModule }      from '../notifications/notifications.module'

@Module({
  imports:     [PrismaModule, NotificationsModule],
  providers:   [InvoicesService, DidoxService, ContractMonitorService, InvoicesCron],
  controllers: [InvoicesController, DidoxController],
  exports:     [InvoicesService, DidoxService, ContractMonitorService],
})
export class InvoicesModule {}
