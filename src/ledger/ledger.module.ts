import { Module } from '@nestjs/common';
import { LedgerService } from './ledger.service.js';
import { LedgerController } from './ledger.controller.js';
import { MeasurementsModule } from '../measurements/measurements.module.js';
import { ClientsModule } from '../clients/clients.module.js';
import { ShopsModule } from '../shops/shops.module.js';

@Module({
  imports: [MeasurementsModule, ClientsModule, ShopsModule],
  controllers: [LedgerController],
  providers: [LedgerService],
  exports: [LedgerService],
})
export class LedgerModule {}
