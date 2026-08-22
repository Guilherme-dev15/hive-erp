import { Controller, Get, Param } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('api/v2/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }
}
