import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Shop, ShopDocument } from './schemas/shop.schema.js';
import { CreateShopDto } from './dto/create-shop.dto.js';
import { UpdateShopDto } from './dto/update-shop.dto.js';

@Injectable()
export class ShopsService {
  constructor(@InjectModel(Shop.name) private shopModel: Model<ShopDocument>) {}

  async create(createShopDto: CreateShopDto): Promise<ShopDocument> {
    const shop = new this.shopModel(createShopDto);
    return shop.save();
  }

  async findById(id: string | Types.ObjectId): Promise<ShopDocument | null> {
    return this.shopModel.findById(id).exec();
  }

  async update(id: string | Types.ObjectId, updateShopDto: UpdateShopDto): Promise<ShopDocument> {
    const updated = await this.shopModel
      .findByIdAndUpdate(id, updateShopDto, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Shop not found');
    }
    return updated;
  }

  async getNextSlipNumber(shopId: string | Types.ObjectId): Promise<string> {
    const shop = await this.shopModel.findById(shopId).exec();
    if (!shop) throw new NotFoundException('Shop not found');
    const currentYear = new Date().getFullYear();
    const counter = (shop.slip_counter || 100) + 1;
    shop.slip_counter = counter;
    await shop.save();
    return `SL-${currentYear}-${counter.toString().padStart(3, '0')}`;
  }

  async getNextSerialNumber(shopId: string | Types.ObjectId): Promise<string> {
    const shop = await this.shopModel.findById(shopId).exec();
    if (!shop) throw new NotFoundException('Shop not found');
    const counter = (shop.serial_counter || 100) + 1;
    shop.serial_counter = counter;
    await shop.save();
    return `SR-${counter}`;
  }
}
