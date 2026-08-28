import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('api/v2/inventory')
@UseGuards(AuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('logs/:productId')
  getLogs(@Param('productId') productId: string, @Request() req: any) {
    return this.inventoryService.getLogs(productId, req.user.id);
  }

  @Post('adjust')
  adjustInventory(@Body('productId') productId: string, @Body() adjustDto: AdjustInventoryDto, @Request() req: any) {
    // O Express antigo usava { productId, type, quantity, userName } direto no body.
    // Preservamos o contrato: extraímos productId e passamos o resto como DTO.
    return this.inventoryService.adjustInventory(productId, adjustDto, req.user.id);
  }
}
