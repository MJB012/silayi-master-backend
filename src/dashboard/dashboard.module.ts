import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';
import { DashboardController } from './dashboard.controller.js';
import { MeasurementsModule } from '../measurements/measurements.module.js';
import { ClientsModule } from '../clients/clients.module.js';

@Module({
  imports: [MeasurementsModule, ClientsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
