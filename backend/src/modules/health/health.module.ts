import { Module } from '@nestjs/common'
import { HealthService }            from './health.service'
import { HealthController }         from './health.controller'
import { IncidentReporterService }  from './incident-reporter.service'
import { PrismaModule }             from '../prisma/prisma.module'

@Module({
  imports:     [PrismaModule],
  providers:   [HealthService, IncidentReporterService],
  controllers: [HealthController],
  exports:     [HealthService, IncidentReporterService],
})
export class HealthModule {}
