import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { MeasurementsService } from '../measurements/measurements.service.js';
import { ClientsService } from '../clients/clients.service.js';
import { ShopsService } from '../shops/shops.service.js';
import { PaymentStatusEnum } from '../enums/index.js';

@Injectable()
export class LedgerService {
  constructor(
    private measurementsService: MeasurementsService,
    private clientsService: ClientsService,
    private shopsService: ShopsService,
  ) {}

  async getClientLedger(shopId: string | Types.ObjectId, clientId: string) {
    const client = await this.clientsService.findById(clientId, shopId);
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const items = await this.measurementsService.findAll(shopId, {
      clientId,
    });

    const totalSuits = items.length;
    const totalBilled = items.reduce((sum, item) => sum + (item.total_amount || 0), 0);
    const totalPaid = items.reduce((sum, item) => sum + (item.advance_amount || 0), 0);
    const totalBalance = Math.max(0, totalBilled - totalPaid);

    return {
      client: {
        id: client._id,
        serial_number: client.serial_number,
        name: client.name,
        phone: client.phone,
        address: client.address,
      },
      summary: {
        total_suits: totalSuits,
        total_billed: totalBilled,
        total_paid: totalPaid,
        total_balance: totalBalance,
      },
      items,
    };
  }

  async generateWhatsAppSummary(shopId: string | Types.ObjectId, clientId: string) {
    const shop = await this.shopsService.findById(shopId);
    const ledger = await this.getClientLedger(shopId, clientId);
    const shopName = shop?.name || 'Silayi Master';
    const client = ledger.client;
    const summary = ledger.summary;

    let text = `*السلام علیکم ${client.name} صاحب!*\n`;
    text += `*${shopName}* سے آپ کا مکمل کھاتہ:\n`;
    text += `سیریل نمبر: *${client.serial_number}* | موبائل: ${client.phone}\n`;
    text += `------------------------------------\n`;
    text += `*کھاتہ کی تفصیل (سلائی آرڈرز):*\n`;

    ledger.items.forEach((item, index) => {
      const gName =
        item.garment_type === 'waistcoat'
          ? 'واسکٹ'
          : item.garment_type === 'kurta_pajama'
          ? 'کرتہ پاجامہ'
          : 'شلوار قمیض';

      text += `${index + 1}. پرچی #${item.receipt_number} (${gName}) - ${item.order_date}\n`;
      text += `   کل بل: روپے ${item.total_amount} | ادا: روپے ${item.advance_amount}\n`;
      if (item.balance_amount > 0) {
        text += `   *بقیہ واجب الادا:* روپے ${item.balance_amount}\n`;
      } else {
        text += `   سٹیٹس: *مکمل ادا شدہ*\n`;
      }
    });

    text += `------------------------------------\n`;
    text += `*کل تیار سوٹ:* ${summary.total_suits}\n`;
    text += `*کل بل رقم:* روپے ${summary.total_billed}\n`;
    text += `*کل وصول شدہ:* روپے ${summary.total_paid}\n`;
    text += `*کل واجب الادا رقم:* روپے ${summary.total_balance}\n`;
    text += `\nشکریہ! آپ کے اعتماد کے مشکور ہیں۔`;

    const encoded = encodeURIComponent(text);
    const cleanPhone = client.phone.replace(/[\s\-()]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;

    return {
      client_name: client.name,
      client_phone: client.phone,
      message_text: text,
      whatsapp_url: whatsappUrl,
    };
  }

  async generateWhatsAppSlip(shopId: string | Types.ObjectId, measurementId: string) {
    const shop = await this.shopsService.findById(shopId);
    const item = await this.measurementsService.findById(measurementId, shopId);
    if (!item) {
      throw new NotFoundException('Slip not found');
    }

    const shopName = shop?.name || 'Silayi Master';
    const gName =
      item.garment_type === 'waistcoat'
        ? 'واسکٹ'
        : item.garment_type === 'kurta_pajama'
        ? 'کرتہ پاجامہ'
        : 'شلوار قمیض';

    let text = `*السلام علیکم ${item.client_name} صاحب!*\n`;
    text += `*${shopName}* کی طرف سے سوٹ کی پرچی:\n`;
    text += `سیریل نمبر: *${item.serial_number}* | پرچی: *#${item.receipt_number}*\n`;
    text += `لباس: *${gName}* | تاریخ: *${item.order_date}*\n`;
    text += `کل رقم: روپے ${item.total_amount}\n`;
    text += `وصول رقم: روپے ${item.advance_amount}\n`;
    text += `بقیہ رقم: روپے ${item.balance_amount}\n`;
    if (item.style_notes) {
      text += `سلائی ہدایات: ${item.style_notes}\n`;
    }
    text += `\nشکریہ!`;

    const encoded = encodeURIComponent(text);
    const cleanPhone = item.client_phone.replace(/[\s\-()]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;

    return {
      receipt_number: item.receipt_number,
      client_name: item.client_name,
      client_phone: item.client_phone,
      message_text: text,
      whatsapp_url: whatsappUrl,
    };
  }

  async markAllClientSlipsPaid(shopId: string | Types.ObjectId, clientId: string) {
    const items = await this.measurementsService.findAll(shopId, { clientId });
    let totalPaidDelta = 0;

    for (const item of items) {
      if (item.payment_status !== PaymentStatusEnum.PAID) {
        const delta = item.total_amount - item.advance_amount;
        totalPaidDelta += delta;
        await this.measurementsService.updatePayment(item._id, shopId, PaymentStatusEnum.PAID);
      }
    }

    return {
      message: 'All client slips marked as paid successfully',
      cleared_balance_amount: totalPaidDelta,
    };
  }
}
