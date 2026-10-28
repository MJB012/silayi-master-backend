import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Measurement, MeasurementSchema } from './schemas/measurement.schema.js';
import { MeasurementsService } from './measurements.service.js';
import { MeasurementsController } from './measurements.controller.js';
import { ClientsModule } from '../clients/clients.module.js';
import { ShopsModule } from '../shops/shops.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Measurement.name, schema: MeasurementSchema }]),
    ClientsModule,
    ShopsModule,
  ],
  controllers: [MeasurementsController],
  providers: [MeasurementsService],
  exports: [MeasurementsService],
})
export class MeasurementsModule {}
