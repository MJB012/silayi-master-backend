import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { GarmentTypeEnum, OrderStatusEnum, PaymentStatusEnum } from '../../enums/index.js';
import { Shop } from '../../shops/schemas/shop.schema.js';
import { Client, KameezMeasurements, ShalwarMeasurements } from '../../clients/schemas/client.schema.js';

export type MeasurementDocument = Measurement & Document;

@Schema({ timestamps: true })
export class Measurement {
  @Prop({ type: Types.ObjectId, ref: 'Shop', required: true, index: true })
  shop_id: Types.ObjectId | Shop;

  @Prop({ type: Types.ObjectId, ref: 'Client', required: true, index: true })
  client_id: Types.ObjectId | Client;

  @Prop({ required: true, trim: true, index: true })
  serial_number: string; // Shopkeeper manual book number (e.g. SR-101)

  @Prop({ required: true, trim: true, index: true })
  receipt_number: string; // Slip # (e.g. SL-2026-081)

  @Prop({ required: true, trim: true })
  client_name: string;

  @Prop({ required: true, trim: true })
  client_phone: string;

  @Prop({
    type: String,
    enum: GarmentTypeEnum,
    default: GarmentTypeEnum.SHALWAR_KAMEEZ,
    index: true,
  })
  garment_type: GarmentTypeEnum;

  @Prop({ trim: true, default: () => new Date().toLocaleDateString('en-GB') })
  order_date: string;

  @Prop({ trim: true, default: '' })
  delivery_date: string;

  @Prop({ trim: true, default: '' })
  last_stitched_date?: string;

  @Prop({
    type: String,
    enum: OrderStatusEnum,
    default: OrderStatusEnum.IN_PROGRESS,
    index: true,
  })
  status: OrderStatusEnum;

  @Prop({ type: Boolean, default: false })
  urgent: boolean;

  @Prop({ type: KameezMeasurements, default: () => ({}) })
  kameez: KameezMeasurements;

  @Prop({ type: ShalwarMeasurements, default: () => ({}) })
  shalwar: ShalwarMeasurements;

  @Prop({ trim: true, default: '' })
  style_notes?: string;

  @Prop({ type: Number, required: true, min: 0 })
  total_amount: number;

  @Prop({ type: Number, default: 0, min: 0 })
  advance_amount: number;

  @Prop({ type: Number, default: 0, min: 0 })
  balance_amount: number;

  @Prop({
    type: String,
    enum: PaymentStatusEnum,
    default: PaymentStatusEnum.UNPAID,
    index: true,
  })
  payment_status: PaymentStatusEnum;
}

export const MeasurementSchema = SchemaFactory.createForClass(Measurement);

// Fast compound indices for search and category filtering
MeasurementSchema.index({ shop_id: 1, garment_type: 1 });
MeasurementSchema.index({ shop_id: 1, status: 1 });
MeasurementSchema.index({ shop_id: 1, client_id: 1, createdAt: -1 });
