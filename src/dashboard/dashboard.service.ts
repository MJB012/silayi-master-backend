import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { MeasurementsService } from '../measurements/measurements.service.js';
import { ClientsService } from '../clients/clients.service.js';
import { OrderStatusEnum } from '../enums/index.js';

@Injectable()
export class DashboardService {
  constructor(
    private measurementsService: MeasurementsService,
    private clientsService: ClientsService,
  ) {}

  async getMetrics(shopId: string | Types.ObjectId) {
    const [clients, allMeasurements] = await Promise.all([
      this.clientsService.findAll(shopId),
      this.measurementsService.findAll(shopId),
    ]);

    const totalClients = clients.length;
    const inProgress = allMeasurements.filter((m) => m.status === OrderStatusEnum.IN_PROGRESS).length;
    const ready = allMeasurements.filter((m) => m.status === OrderStatusEnum.READY).length;
    const delivered = allMeasurements.filter((m) => m.status === OrderStatusEnum.DELIVERED).length;

    const totalRevenue = allMeasurements.reduce((sum, m) => sum + (m.total_amount || 0), 0);
    const totalCollected = allMeasurements.reduce((sum, m) => sum + (m.advance_amount || 0), 0);
    const totalReceivable = Math.max(0, totalRevenue - totalCollected);

    const urgentOrders = allMeasurements
      .filter((m) => m.urgent && m.status !== OrderStatusEnum.DELIVERED)
      .slice(0, 5);

    const recentOrders = allMeasurements.slice(0, 6);

    return {
      stats: {
        total: totalClients,
        inProgress,
        ready,
        delivered,
      },
      financials: {
        totalRevenue,
        totalCollected,
        totalReceivable,
      },
      urgentOrders,
      recentOrders,
    };
  }
}
