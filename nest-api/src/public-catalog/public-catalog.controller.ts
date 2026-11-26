import { Body, Controller, Get, Header, Headers, Post, Query, UseGuards } from '@nestjs/common';
import { PublicCatalogQueryDto } from './dto/public-catalog-query.dto';
import { PublicCatalogService } from './public-catalog.service';
import { PublicCatalogResponse } from './public-catalog.types';
import { CreatePublicOrderDto, PublicOrderResponse } from './dto/create-public-order.dto';
import { PublicRateLimitGuard, RateLimit } from '../common/public-rate-limit.guard';

@Controller('api/v1/public')
@UseGuards(PublicRateLimitGuard)
export class PublicCatalogController {
  constructor(private readonly publicCatalogService: PublicCatalogService) {}

  @Get('catalog')
  @Header('Cache-Control', 'no-store')
  @RateLimit({ limit: 120, windowMs: 60_000, keyPrefix: 'public-catalog' })
  getCatalog(@Query() query: PublicCatalogQueryDto): Promise<PublicCatalogResponse> {
    return this.publicCatalogService.getCatalog(query);
  }

  @Post('orders')
  @RateLimit({ limit: 10, windowMs: 60_000, keyPrefix: 'public-orders' })
  createOrder(
    @Body() dto: CreatePublicOrderDto,
    @Headers('origin') origin?: string,
  ): Promise<PublicOrderResponse> {
    return this.publicCatalogService.createOrder(dto, origin);
  }
}

