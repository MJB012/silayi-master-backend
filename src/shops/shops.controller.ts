import { Controller, Get, Put, Body, NotFoundException } from '@nestjs/common';
import { ShopsService } from './shops.service.js';
import { UpdateShopDto } from './dto/update-shop.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get('my-shop')
  async getMyShop(@CurrentUser() user: any) {
    const shopId = user.shop_id || user.shop;
    if (!shopId) {
      throw new NotFoundException('No shop associated with this user account');
    }
    return this.shopsService.findById(shopId);
  }

  @Put('my-shop')
  async updateMyShop(@CurrentUser() user: any, @Body() updateShopDto: UpdateShopDto) {
    const shopId = user.shop_id || user.shop;
    if (!shopId) {
      throw new NotFoundException('No shop associated with this user account');
    }
    return this.shopsService.update(shopId, updateShopDto);
  }
}
