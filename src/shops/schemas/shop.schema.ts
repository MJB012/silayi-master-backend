import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ShopDocument = Shop & Document;

@Schema({ timestamps: true })
export class Shop {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true, default: '' })
  urdu_name?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  owner?: Types.ObjectId;

  @Prop({ trim: true, default: '' })
  contact_phone?: string;

  @Prop({ trim: true, default: '' })
  contact_email?: string;

  @Prop({ trim: true, default: '' })
  address?: string;

  @Prop({ default: 'Rs.' })
  currency?: string;

  @Prop({ type: Number, default: 100 })
  slip_counter?: number;

  @Prop({ type: Number, default: 100 })
  serial_counter?: number;
}

export const ShopSchema = SchemaFactory.createForClass(Shop);
