import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Client, ClientDocument } from './schemas/client.schema.js';
import { CreateClientDto } from './dto/create-client.dto.js';
import { UpdateClientDto } from './dto/update-client.dto.js';
import { ShopsService } from '../shops/shops.service.js';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
    private shopsService: ShopsService,
  ) {}

  async findAll(shopId: string | Types.ObjectId, search?: string): Promise<ClientDocument[]> {
    const filter: any = { shop_id: new Types.ObjectId(shopId.toString()) };

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { phone: { $regex: q.replace(/[\s\-]/g, ''), $options: 'i' } },
        { serial_number: { $regex: q, $options: 'i' } },
      ];
    }

    return this.clientModel.find(filter).sort({ updatedAt: -1 }).exec();
  }

  async findById(id: string | Types.ObjectId, shopId?: string | Types.ObjectId): Promise<ClientDocument | null> {
    const filter: any = { _id: id };
    if (shopId) {
      filter.shop_id = new Types.ObjectId(shopId.toString());
    }
    return this.clientModel.findOne(filter).exec();
  }

  async findByPhone(phone: string, shopId: string | Types.ObjectId): Promise<ClientDocument | null> {
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    return this.clientModel
      .findOne({
        shop_id: new Types.ObjectId(shopId.toString()),
        phone: { $regex: cleanPhone, $options: 'i' },
      })
      .exec();
  }

  async create(shopId: string | Types.ObjectId, createClientDto: CreateClientDto): Promise<ClientDocument> {
    let serial = createClientDto.serial_number?.trim();
    if (!serial) {
      serial = await this.shopsService.getNextSerialNumber(shopId);
    }

    const client = new this.clientModel({
      ...createClientDto,
      serial_number: serial,
      shop_id: new Types.ObjectId(shopId.toString()),
    });

    return client.save();
  }

  async update(
    id: string | Types.ObjectId,
    shopId: string | Types.ObjectId,
    updateClientDto: UpdateClientDto,
  ): Promise<ClientDocument> {
    const updated = await this.clientModel
      .findOneAndUpdate(
        { _id: id, shop_id: new Types.ObjectId(shopId.toString()) },
        updateClientDto,
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Client not found');
    }

    return updated;
  }

  async updateFinancials(
    id: string | Types.ObjectId,
    billedDelta: number,
    paidDelta: number,
  ): Promise<ClientDocument | null> {
    const client = await this.clientModel.findById(id).exec();
    if (!client) return null;

    client.total_orders = Math.max(0, (client.total_orders || 0) + (billedDelta !== 0 ? 1 : 0));
    client.total_billed = Math.max(0, (client.total_billed || 0) + billedDelta);
    client.total_paid = Math.max(0, (client.total_paid || 0) + paidDelta);
    client.total_balance = Math.max(0, client.total_billed - client.total_paid);

    return client.save();
  }

  async delete(id: string | Types.ObjectId, shopId: string | Types.ObjectId): Promise<{ success: boolean }> {
    const res = await this.clientModel
      .findOneAndDelete({ _id: id, shop_id: new Types.ObjectId(shopId.toString()) })
      .exec();
    if (!res) {
      throw new NotFoundException('Client not found');
    }
    return { success: true };
  }
}
