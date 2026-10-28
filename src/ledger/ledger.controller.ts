import { Controller, Get, Post, Param } from '@nestjs/common';
import { LedgerService } from './ledger.service.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get('client/:clientId')
  async getClientLedger(
    @CurrentUser() user: any,
    @Param('clientId') clientId: string,
  ) {
    const shopId = user.shop_id || user.shop;
    return this.ledgerService.getClientLedger(shopId, clientId);
  }

  @Get('client/:clientId/whatsapp-summary')
  async getWhatsAppSummary(
    @CurrentUser() user: any,
    @Param('clientId') clientId: string,
  ) {
    const shopId = user.shop_id || user.shop;
    return this.ledgerService.generateWhatsAppSummary(shopId, clientId);
  }

  @Get('slip/:measurementId/whatsapp-slip')
  async getWhatsAppSlip(
    @CurrentUser() user: any,
    @Param('measurementId') measurementId: string,
  ) {
    const shopId = user.shop_id || user.shop;
    return this.ledgerService.generateWhatsAppSlip(shopId, measurementId);
  }

  @Post('client/:clientId/mark-paid')
  async markAllClientSlipsPaid(
    @CurrentUser() user: any,
    @Param('clientId') clientId: string,
  ) {
    const shopId = user.shop_id || user.shop;
    return this.ledgerService.markAllClientSlipsPaid(shopId, clientId);
  }
}
