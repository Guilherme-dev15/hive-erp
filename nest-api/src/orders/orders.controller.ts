import { Controller, Post, Put, Param, Body } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('api/v2/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() orderData: any) {
    return this.ordersService.create(orderData);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() orderData: any) {
    return this.ordersService.update(id, orderData);
  }
}
