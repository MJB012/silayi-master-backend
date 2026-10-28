import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { GarmentTypeEnum, OrderStatusEnum, PaymentStatusEnum } from '../../enums/index.js';

export class CreateMeasurementDto {
  @IsOptional()
  @IsString()
  client_id?: string;

  @IsOptional()
  @IsString()
  serial_number?: string;

  @IsOptional()
  @IsString()
  receipt_number?: string;

  @IsNotEmpty()
  @IsString()
  client_name: string;

  @IsNotEmpty()
  @IsString()
  client_phone: string;

  @IsOptional()
  @IsEnum(GarmentTypeEnum)
  garment_type?: GarmentTypeEnum;

  @IsOptional()
  @IsString()
  order_date?: string;

  @IsOptional()
  @IsString()
  delivery_date?: string;

  @IsOptional()
  @IsEnum(OrderStatusEnum)
  status?: OrderStatusEnum;

  @IsOptional()
  @IsBoolean()
  urgent?: boolean;

  @IsOptional()
  kameez?: any;

  @IsOptional()
  shalwar?: any;

  @IsOptional()
  @IsString()
  style_notes?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  total_amount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  advance_amount?: number;

  @IsOptional()
  @IsEnum(PaymentStatusEnum)
  payment_status?: PaymentStatusEnum;
}
