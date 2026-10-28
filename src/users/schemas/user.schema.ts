import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRoleEnum } from '../../enums/index.js';
import { Shop } from '../../shops/schemas/shop.schema.js';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class User {
  @Prop({ required: true, trim: true })
  full_name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    type: String,
    enum: UserRoleEnum,
    default: UserRoleEnum.ADMIN,
  })
  role: UserRoleEnum;

  @Prop({ type: Types.ObjectId, ref: 'Shop' })
  shop: Types.ObjectId | Shop;

  @Prop({ type: String, default: null })
  reset_password_code?: string | null;

  @Prop({ type: Date, default: null })
  reset_password_expires?: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('shop_name').get(function () {
  return (this.shop as any)?.name;
});

UserSchema.virtual('shop_urdu_name').get(function () {
  return (this.shop as any)?.urdu_name;
});
