import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Shop } from '../../shops/schemas/shop.schema.js';

export type ClientDocument = Client & Document;

@Schema({ _id: false })
export class KameezMeasurements {
  @Prop({ default: '' }) length: string; // لمبائی
  @Prop({ default: '' }) shoulder: string; // تیرا
  @Prop({ default: '' }) sleeves: string; // بازو
  @Prop({ default: '' }) collar: string; // گلا
  @Prop({ default: '' }) chest: string; // چھاتی
  @Prop({ default: '' }) waist: string; // کمر
  @Prop({ default: '' }) daman: string; // دامن
}

@Schema({ _id: false })
export class ShalwarMeasurements {
  @Prop({ default: '' }) length: string; // لمبائی
  @Prop({ default: '' }) paoncha: string; // پانچہ
  @Prop({ default: '' }) asan?: string; // آسن
  @Prop({ default: '' }) waist?: string; // نیفہ / کمر
}

@Schema({ timestamps: true })
export class Client {
  @Prop({ type: Types.ObjectId, ref: 'Shop', required: true, index: true })
  shop_id: Types.ObjectId | Shop;

  @Prop({ required: true, trim: true, index: true })
  serial_number: string;

  @Prop({ required: true, trim: true, index: true })
  name: string;

  @Prop({ required: true, trim: true, index: true })
  phone: string;

  @Prop({ trim: true, default: '' })
  alternate_phone?: string;

  @Prop({ trim: true, default: '' })
  address?: string;

  @Prop({ trim: true, default: '' })
  notes?: string;

  @Prop({ type: KameezMeasurements, default: () => ({}) })
  latest_kameez?: KameezMeasurements;

  @Prop({ type: ShalwarMeasurements, default: () => ({}) })
  latest_shalwar?: ShalwarMeasurements;

  @Prop({ type: Number, default: 0 })
  total_orders: number;

  @Prop({ type: Number, default: 0 })
  total_billed: number;

  @Prop({ type: Number, default: 0 })
  total_paid: number;

  @Prop({ type: Number, default: 0 })
  total_balance: number;
}

export const ClientSchema = SchemaFactory.createForClass(Client);

// Compound index for fast client searches per shop
ClientSchema.index({ shop_id: 1, name: 'text', phone: 'text', serial_number: 'text' });
