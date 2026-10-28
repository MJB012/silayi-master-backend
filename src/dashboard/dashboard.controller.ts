import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  async getMetrics(@CurrentUser() user: any) {
    const shopId = user.shop_id || user.shop;
    return this.dashboardService.getMetrics(shopId);
  }
}
