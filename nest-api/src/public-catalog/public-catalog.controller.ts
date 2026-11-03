import { Body, Controller, Get, Header, Post, Query } from '@nestjs/common';
import { PublicCatalogQueryDto } from './dto/public-catalog-query.dto';
import { PublicCatalogService } from './public-catalog.service';
import { PublicCatalogResponse } from './public-catalog.types';
import { CreatePublicOrderDto, PublicOrderResponse } from './dto/create-public-order.dto';

@Controller('api/v1/public')
export class PublicCatalogController {
  constructor(private readonly publicCatalogService: PublicCatalogService) {}

  @Get('catalog')
  @Header('Cache-Control', 'no-store')
  getCatalog(@Query() query: PublicCatalogQueryDto): Promise<PublicCatalogResponse> {
    return this.publicCatalogService.getCatalog(query);
  }

  @Post('orders')
  createOrder(@Body() dto: CreatePublicOrderDto): Promise<PublicOrderResponse> {
    return this.publicCatalogService.createOrder(dto);
  }
}

