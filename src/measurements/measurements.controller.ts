import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { MeasurementsService } from './measurements.service.js';
import { CreateMeasurementDto } from './dto/create-measurement.dto.js';
import { UpdateMeasurementDto } from './dto/update-measurement.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { PaymentStatusEnum, OrderStatusEnum } from '../enums/index.js';

@Controller('measurements')
export class MeasurementsController {
  constructor(private readonly measurementsService: MeasurementsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
  ) {
    const shopId = user.shop_id || user.shop;
    return this.measurementsService.findAll(shopId, {
      category,
      search,
      status,
      clientId,
    });
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const shopId = user.shop_id || user.shop;
    const measurement = await this.measurementsService.findById(id, shopId);
    if (!measurement) {
      throw new NotFoundException('Measurement not found');
    }
    return measurement;
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() dto: CreateMeasurementDto) {
    const shopId = user.shop_id || user.shop;
    return this.measurementsService.create(shopId, dto);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateMeasurementDto,
  ) {
    const shopId = user.shop_id || user.shop;
    return this.measurementsService.update(id, shopId, dto);
  }

  @Patch(':id/payment')
  async updatePayment(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('payment_status') paymentStatus: PaymentStatusEnum,
  ) {
    const shopId = user.shop_id || user.shop;
    return this.measurementsService.updatePayment(id, shopId, paymentStatus);
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('status') status: OrderStatusEnum,
  ) {
    const shopId = user.shop_id || user.shop;
    return this.measurementsService.updateStatus(id, shopId, status);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    const shopId = user.shop_id || user.shop;
    return this.measurementsService.delete(id, shopId);
  }
}
