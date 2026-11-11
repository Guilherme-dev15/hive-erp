import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { BillingService } from './billing.service';
import { CreateCheckoutIntentDto } from './dto/create-checkout-intent.dto';
import { CreateSetupRequestDto } from './dto/create-setup-request.dto';

@Controller('api/v2/billing')
@UseGuards(AuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  private requireUserId(req: any): string {
    if (!req?.user?.id) {
      throw new UnauthorizedException('Usuário não provisionado no ERP');
    }
    return req.user.id;
  }

  @Get('status')
  getStatus(@Request() req: any) {
    const userId = this.requireUserId(req);
    return this.billingService.getStatus(userId, Boolean(req.user?.isSuperAdmin));
  }

  @Post('checkout-intent')
  createCheckoutIntent(@Request() req: any, @Body() dto: CreateCheckoutIntentDto) {
    const userId = this.requireUserId(req);
    return this.billingService.createCheckoutIntent(userId, dto, Boolean(req.user?.isSuperAdmin));
  }

  @Post('setup-requests')
  createSetupRequest(@Request() req: any, @Body() dto: CreateSetupRequestDto) {
    const userId = this.requireUserId(req);
    return this.billingService.createSetupRequest(userId, dto, Boolean(req.user?.isSuperAdmin));
  }

  @Get('setup-requests')
  listSetupRequests(@Request() req: any) {
    const userId = this.requireUserId(req);
    return this.billingService.listSetupRequests(userId);
  }

  @Patch('setup-requests/:id/cancel')
  cancelSetupRequest(@Param('id') id: string, @Request() req: any) {
    const userId = this.requireUserId(req);
    return this.billingService.cancelSetupRequest(id, userId);
  }
}
