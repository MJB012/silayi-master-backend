import { Module } from '@nestjs/common';
import { SeedService } from './seed.service.js';
import { SeedController } from './seed.controller.js';
import { ShopsModule } from '../shops/shops.module.js';
import { UsersModule } from '../users/users.module.js';
import { ClientsModule } from '../clients/clients.module.js';
import { MeasurementsModule } from '../measurements/measurements.module.js';

@Module({
  imports: [ShopsModule, UsersModule, ClientsModule, MeasurementsModule],
  controllers: [SeedController],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
