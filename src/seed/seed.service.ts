import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { ShopsService } from '../shops/shops.service.js';
import { UsersService } from '../users/users.service.js';
import { ClientsService } from '../clients/clients.service.js';
import { MeasurementsService } from '../measurements/measurements.service.js';
import { GarmentTypeEnum, OrderStatusEnum, PaymentStatusEnum, UserRoleEnum } from '../enums/index.js';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private shopsService: ShopsService,
    private usersService: UsersService,
    private clientsService: ClientsService,
    private measurementsService: MeasurementsService,
  ) {}

  async seedDemoData() {
    this.logger.log('Checking database seed state...');

    // 1. Check if demo user already exists
    const existing = await this.usersService.findByEmail('master@silayimaster.com');
    if (existing) {
      this.logger.log('Demo data already seeded.');
      return { message: 'Demo data already exists', user: existing.email };
    }

    this.logger.log('Seeding initial Silayi Master demo database...');

    // 2. Create Shop
    const shop = await this.shopsService.create({
      name: 'Al-Karam Tailors',
      urdu_name: 'الکرم ٹیلرز',
      contact_phone: '0300-1234567',
      contact_email: 'master@silayimaster.com',
      address: 'Shop # 14, Main Tailor Bazaar, Lahore',
      currency: 'Rs.',
    });

    // 3. Create Master Tailor User
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await this.usersService.create({
      full_name: 'Master Muhammad Tariq',
      email: 'master@silayimaster.com',
      phone: '03001234567',
      password: hashedPassword,
      shop: shop._id as Types.ObjectId,
      role: UserRoleEnum.ADMIN,
    });

    shop.owner = user._id as Types.ObjectId;
    await shop.save();

    // 4. Create Initial Clients & Orders matching mobile app
    const demoRecords = [
      {
        serial_number: 'SR-101',
        receipt_number: 'SL-2026-081',
        client_name: 'Haji Abdul Rehman',
        client_phone: '0300-9876543',
        garment_type: GarmentTypeEnum.SHALWAR_KAMEEZ,
        order_date: '24 Oct 2026',
        delivery_date: '28 Oct 2026',
        status: OrderStatusEnum.IN_PROGRESS,
        urgent: true,
        kameez: {
          length: '41.5',
          shoulder: '18.5',
          sleeves: '24.0',
          collar: '16.0',
          chest: '23.0',
          waist: '22.5',
          daman: '24.5',
        },
        shalwar: {
          length: '39.0',
          paoncha: '8.5',
          asan: '16.5',
          waist: '25.0',
        },
        style_notes: 'بین کالر (1.25 انچ)، سامنے ایک پاکٹ، گول دامن، کف بازو',
        total_amount: 2800,
        advance_amount: 1500,
        payment_status: PaymentStatusEnum.PARTIAL,
      },
      {
        serial_number: 'SR-102',
        receipt_number: 'SL-2026-082',
        client_name: 'Chaudhry Nadeem Akhtar',
        client_phone: '0321-4567890',
        garment_type: GarmentTypeEnum.KURTA_PAJAMA,
        order_date: '23 Oct 2026',
        delivery_date: '27 Oct 2026',
        status: OrderStatusEnum.IN_PROGRESS,
        urgent: false,
        kameez: {
          length: '40.0',
          shoulder: '17.5',
          sleeves: '23.5',
          collar: '15.5',
          chest: '21.5',
          waist: '21.0',
          daman: '23.0',
        },
        shalwar: {
          length: '38.0',
          paoncha: '7.5',
          asan: '15.5',
          waist: '23.0',
        },
        style_notes: 'سادہ کرتہ پٹی، گول گلا، چورس دامن، سادہ پاجامہ',
        total_amount: 2400,
        advance_amount: 2400,
        payment_status: PaymentStatusEnum.PAID,
      },
      {
        serial_number: 'SR-103',
        receipt_number: 'SL-2026-083',
        client_name: 'Malik Usman Tariq',
        client_phone: '0333-5551234',
        garment_type: GarmentTypeEnum.WAISTCOAT,
        order_date: '22 Oct 2026',
        delivery_date: '26 Oct 2026',
        status: OrderStatusEnum.READY,
        urgent: false,
        kameez: {
          length: '28.0',
          shoulder: '18.0',
          sleeves: 'N/A',
          collar: '16.0',
          chest: '22.5',
          waist: '21.5',
          daman: '22.0',
        },
        shalwar: {
          length: 'N/A',
          paoncha: 'N/A',
        },
        style_notes: 'شاہی واسکٹ، بلیک راول سلک کپڑا، میٹل گولڈ بٹن، 3 پاکٹس',
        total_amount: 3500,
        advance_amount: 3500,
        payment_status: PaymentStatusEnum.PAID,
      },
      {
        serial_number: 'SR-104',
        receipt_number: 'SL-2026-084',
        client_name: 'Sheikh Farooq Ahmed',
        client_phone: '0345-6789012',
        garment_type: GarmentTypeEnum.SHALWAR_KAMEEZ,
        order_date: '20 Oct 2026',
        delivery_date: '25 Oct 2026',
        status: OrderStatusEnum.DELIVERED,
        urgent: false,
        kameez: {
          length: '42.0',
          shoulder: '19.0',
          sleeves: '24.5',
          collar: '16.5',
          chest: '24.0',
          waist: '23.5',
          daman: '25.0',
        },
        shalwar: {
          length: '40.0',
          paoncha: '9.0',
          asan: '17.0',
        },
        style_notes: 'فل کالر (1.5 انچ)، فرنٹ ڈبل سلائی، لٹھا کپڑا',
        total_amount: 3000,
        advance_amount: 3000,
        payment_status: PaymentStatusEnum.PAID,
      },
    ];

    for (const record of demoRecords) {
      await this.measurementsService.create(shop._id as Types.ObjectId, record);
    }

    this.logger.log('Silayi Master demo database successfully seeded!');
    return {
      message: 'Demo database seeded successfully',
      shop: shop.name,
      tailor: user.full_name,
      email: user.email,
      demo_password: 'password123',
    };
  }
}
