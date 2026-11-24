import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingWebhookGuard } from './billing-webhook.guard';
import { BillingWebhookDto } from './dto/billing-webhook.dto';

@Controller('api/v2/billing/webhook')
@UseGuards(BillingWebhookGuard)
export class BillingWebhookController {
  constructor(private readonly billingService: BillingService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() dto: BillingWebhookDto) {
    return this.billingService.processWebhook(dto);
  }
}
