import { Controller, Get, Header, Query } from '@nestjs/common';
import { PublicCatalogQueryDto } from './dto/public-catalog-query.dto';
import { PublicCatalogService } from './public-catalog.service';
import { PublicCatalogResponse } from './public-catalog.types';

@Controller('api/v1/public/catalog')
export class PublicCatalogController {
  constructor(private readonly publicCatalogService: PublicCatalogService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  getCatalog(@Query() query: PublicCatalogQueryDto): Promise<PublicCatalogResponse> {
    return this.publicCatalogService.getCatalog(query);
  }
}
