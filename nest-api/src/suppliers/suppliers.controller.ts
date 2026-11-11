import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { AuthGuard } from '../auth/auth.guard';
import { SubscriptionGuard } from '../billing/subscription.guard';

@Controller('api/v2/suppliers')
@UseGuards(AuthGuard, SubscriptionGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.suppliersService.findAll(req.user.id);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(req.user.id, dto);
  }

  @Put(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.suppliersService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.suppliersService.remove(req.user.id, id);
  }
}
