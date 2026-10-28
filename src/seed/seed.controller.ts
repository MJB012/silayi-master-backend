import { Controller, Post } from '@nestjs/common';
import { SeedService } from './seed.service.js';
import { Public } from '../common/decorators/public.decorator.js';

@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Public()
  @Post()
  async seed() {
    return this.seedService.seedDemoData();
  }
}
