import { Controller, Get, Param, Post, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { BulkMarkupDto, BulkStatusDto } from './dto/bulk-update.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('api/v2/products')
@UseGuards(AuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.productsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.productsService.findOne(id, req.user.id);
  }

  @Post('bulk-markup')
  updateBulkMarkup(@Body() dto: BulkMarkupDto, @Request() req: any) {
    return this.productsService.updateBulkMarkup(dto, req.user.id);
  }

  @Post('bulk-status')
  updateBulkStatus(@Body() dto: BulkStatusDto, @Request() req: any) {
    return this.productsService.updateBulkStatus(dto, req.user.id);
  }

  @Post()
  create(@Body() createProductDto: CreateProductDto, @Request() req: any) {
    return this.productsService.create(createProductDto, req.user.id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @Request() req: any) {
    return this.productsService.update(id, updateProductDto, req.user.id);
  }
}
