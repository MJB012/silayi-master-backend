import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ClientsService } from './clients.service.js';
import { CreateClientDto } from './dto/create-client.dto.js';
import { UpdateClientDto } from './dto/update-client.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  async findAll(@CurrentUser() user: any, @Query('search') search?: string) {
    const shopId = user.shop_id || user.shop;
    return this.clientsService.findAll(shopId, search);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const shopId = user.shop_id || user.shop;
    const client = await this.clientsService.findById(id, shopId);
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return client;
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() createClientDto: CreateClientDto) {
    const shopId = user.shop_id || user.shop;
    return this.clientsService.create(shopId, createClientDto);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    const shopId = user.shop_id || user.shop;
    return this.clientsService.update(id, shopId, updateClientDto);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    const shopId = user.shop_id || user.shop;
    return this.clientsService.delete(id, shopId);
  }
}
