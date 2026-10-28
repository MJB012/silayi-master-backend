import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Measurement, MeasurementDocument } from './schemas/measurement.schema.js';
import { CreateMeasurementDto } from './dto/create-measurement.dto.js';
import { UpdateMeasurementDto } from './dto/update-measurement.dto.js';
import { ClientsService } from '../clients/clients.service.js';
import { ShopsService } from '../shops/shops.service.js';
import { PaymentStatusEnum, OrderStatusEnum } from '../enums/index.js';

@Injectable()
export class MeasurementsService {
  constructor(
    @InjectModel(Measurement.name)
    private measurementModel: Model<MeasurementDocument>,
    private clientsService: ClientsService,
    private shopsService: ShopsService,
  ) {}

  async findAll(
    shopId: string | Types.ObjectId,
    params: {
      category?: string;
      search?: string;
      status?: string;
      clientId?: string;
    } = {},
  ): Promise<MeasurementDocument[]> {
    const filter: any = { shop_id: new Types.ObjectId(shopId.toString()) };

    // 1. Garment category filter
    if (params.category && params.category !== 'all') {
      filter.garment_type = params.category;
    }

    // 2. Order status filter
    if (params.status && params.status !== 'all') {
      filter.status = params.status;
    }

    // 3. Client ID filter
    if (params.clientId) {
      filter.client_id = new Types.ObjectId(params.clientId);
    }

    // 4. Search query
    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      const cleanPhone = q.replace(/[\s\-]/g, '');
      filter.$or = [
        { client_name: { $regex: q, $options: 'i' } },
        { client_phone: { $regex: cleanPhone, $options: 'i' } },
        { serial_number: { $regex: q, $options: 'i' } },
        { receipt_number: { $regex: q, $options: 'i' } },
      ];
    }

    return this.measurementModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findById(
    id: string | Types.ObjectId,
    shopId?: string | Types.ObjectId,
  ): Promise<MeasurementDocument | null> {
    const filter: any = { _id: id };
    if (shopId) {
      filter.shop_id = new Types.ObjectId(shopId.toString());
    }
    return this.measurementModel.findOne(filter).populate('client_id').exec();
  }

  async create(
    shopId: string | Types.ObjectId,
    dto: CreateMeasurementDto,
  ): Promise<MeasurementDocument> {
    const shopObjectId = new Types.ObjectId(shopId.toString());

    // 1. Resolve or Create Client
    let client = null;
    if (dto.client_id) {
      client = await this.clientsService.findById(dto.client_id, shopObjectId);
    }

    if (!client && dto.client_phone) {
      client = await this.clientsService.findByPhone(dto.client_phone, shopObjectId);
    }

    if (!client) {
      // Auto-create client
      client = await this.clientsService.create(shopObjectId, {
        name: dto.client_name,
        phone: dto.client_phone,
        serial_number: dto.serial_number,
        latest_kameez: dto.kameez,
        latest_shalwar: dto.shalwar,
      });
    }

    // 2. Auto-generate Slip / Receipt Number if not provided
    let receiptNumber = dto.receipt_number?.trim();
    if (!receiptNumber) {
      receiptNumber = await this.shopsService.getNextSlipNumber(shopObjectId);
    }

    // 3. Serial Number
    const serialNumber = dto.serial_number?.trim() || client.serial_number;

    // 4. Calculate financials
    const totalAmount = dto.total_amount ?? 0;
    const advanceAmount = dto.advance_amount ?? 0;
    const balanceAmount = Math.max(0, totalAmount - advanceAmount);

    let paymentStatus = dto.payment_status;
    if (!paymentStatus) {
      if (advanceAmount >= totalAmount && totalAmount > 0) {
        paymentStatus = PaymentStatusEnum.PAID;
      } else if (advanceAmount > 0) {
        paymentStatus = PaymentStatusEnum.PARTIAL;
      } else {
        paymentStatus = PaymentStatusEnum.UNPAID;
      }
    }

    // 5. Create Measurement document
    const measurement = new this.measurementModel({
      ...dto,
      shop_id: shopObjectId,
      client_id: client._id,
      serial_number: serialNumber,
      receipt_number: receiptNumber,
      client_name: dto.client_name || client.name,
      client_phone: dto.client_phone || client.phone,
      total_amount: totalAmount,
      advance_amount: advanceAmount,
      balance_amount: balanceAmount,
      payment_status: paymentStatus,
      status: dto.status || OrderStatusEnum.IN_PROGRESS,
    });

    const saved = await measurement.save();

    // 6. Update Client financials & latest sizes
    await this.clientsService.updateFinancials(client._id, totalAmount, advanceAmount);
    if (dto.kameez || dto.shalwar) {
      await this.clientsService.update(client._id, shopObjectId, {
        latest_kameez: dto.kameez || client.latest_kameez,
        latest_shalwar: dto.shalwar || client.latest_shalwar,
      });
    }

    return saved;
  }

  async update(
    id: string | Types.ObjectId,
    shopId: string | Types.ObjectId,
    dto: UpdateMeasurementDto,
  ): Promise<MeasurementDocument> {
    const shopObjectId = new Types.ObjectId(shopId.toString());
    const existing = await this.measurementModel
      .findOne({ _id: id, shop_id: shopObjectId })
      .exec();

    if (!existing) {
      throw new NotFoundException('Measurement record not found');
    }

    const prevTotal = existing.total_amount;
    const prevPaid = existing.advance_amount;

    const newTotal = dto.total_amount !== undefined ? dto.total_amount : existing.total_amount;
    const newPaid = dto.advance_amount !== undefined ? dto.advance_amount : existing.advance_amount;
    const newBalance = Math.max(0, newTotal - newPaid);

    let newPaymentStatus = dto.payment_status || existing.payment_status;
    if (dto.payment_status === undefined && (dto.total_amount !== undefined || dto.advance_amount !== undefined)) {
      if (newPaid >= newTotal && newTotal > 0) {
        newPaymentStatus = PaymentStatusEnum.PAID;
      } else if (newPaid > 0) {
        newPaymentStatus = PaymentStatusEnum.PARTIAL;
      } else {
        newPaymentStatus = PaymentStatusEnum.UNPAID;
      }
    }

    const updated = await this.measurementModel
      .findByIdAndUpdate(
        id,
        {
          ...dto,
          total_amount: newTotal,
          advance_amount: newPaid,
          balance_amount: newBalance,
          payment_status: newPaymentStatus,
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Measurement record not found');
    }

    // Adjust client financials with delta difference
    const totalDelta = newTotal - prevTotal;
    const paidDelta = newPaid - prevPaid;
    if (totalDelta !== 0 || paidDelta !== 0) {
      const clientId = (existing.client_id as any)?._id || existing.client_id;
      await this.clientsService.updateFinancials(clientId, totalDelta, paidDelta);
    }

    return updated;
  }

  async updatePayment(
    id: string | Types.ObjectId,
    shopId: string | Types.ObjectId,
    paymentStatus: PaymentStatusEnum,
  ): Promise<MeasurementDocument> {
    const shopObjectId = new Types.ObjectId(shopId.toString());
    const existing = await this.measurementModel
      .findOne({ _id: id, shop_id: shopObjectId })
      .exec();

    if (!existing) {
      throw new NotFoundException('Measurement not found');
    }

    const prevPaid = existing.advance_amount;
    let newPaid = existing.advance_amount;

    if (paymentStatus === PaymentStatusEnum.PAID) {
      newPaid = existing.total_amount;
    } else if (paymentStatus === PaymentStatusEnum.UNPAID) {
      newPaid = 0;
    }

    const newBalance = Math.max(0, existing.total_amount - newPaid);

    existing.payment_status = paymentStatus;
    existing.advance_amount = newPaid;
    existing.balance_amount = newBalance;
    const saved = await existing.save();

    // Adjust client paid delta
    const deltaPaid = newPaid - prevPaid;
    if (deltaPaid !== 0) {
      const clientId = (existing.client_id as any)?._id || existing.client_id;
      await this.clientsService.updateFinancials(clientId, 0, deltaPaid);
    }

    return saved;
  }

  async updateStatus(
    id: string | Types.ObjectId,
    shopId: string | Types.ObjectId,
    status: OrderStatusEnum,
  ): Promise<MeasurementDocument> {
    const shopObjectId = new Types.ObjectId(shopId.toString());
    const updated = await this.measurementModel
      .findOneAndUpdate(
        { _id: id, shop_id: shopObjectId },
        { status },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Measurement not found');
    }

    return updated;
  }

  async delete(id: string | Types.ObjectId, shopId: string | Types.ObjectId): Promise<{ success: boolean }> {
    const shopObjectId = new Types.ObjectId(shopId.toString());
    const existing = await this.measurementModel.findOne({ _id: id, shop_id: shopObjectId }).exec();
    if (!existing) {
      throw new NotFoundException('Measurement not found');
    }

    // Deduct from client financials
    const clientId = (existing.client_id as any)?._id || existing.client_id;
    await this.clientsService.updateFinancials(
      clientId,
      -existing.total_amount,
      -existing.advance_amount,
    );

    await this.measurementModel.findByIdAndDelete(id).exec();
    return { success: true };
  }
}
