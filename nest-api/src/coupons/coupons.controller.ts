import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { AuthGuard } from '../auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('api/v2')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('coupons')
  create(@Request() req: any, @Body() createCouponDto: CreateCouponDto) {
    return this.couponsService.create(req.user.id, createCouponDto);
  }

  @Get('coupons')
  findAll(@Request() req: any) {
    return this.couponsService.findAll(req.user.id);
  }

  @Delete('coupons/:id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.couponsService.remove(req.user.id, id);
  }

  // Campaign Mock (Compatibilidade Frontend)
  @Post('campaign/simulate')
  simulateCampaign() {
    return { success: true };
  }

  @Post('campaign/apply')
  applyCampaign() {
    return { success: true };
  }

  @Post('campaign/revert')
  revertCampaign() {
    return { success: true };
  }
}
