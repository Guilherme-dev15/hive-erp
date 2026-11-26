import {
  Body,
  Controller,
  Headers,
  Optional,
  Param,
  Post,
  Query,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { MercadoPagoService } from './mercado-pago.service';
import { PublicRateLimitGuard, RateLimit } from '../common/public-rate-limit.guard';

type RawPaymentRequest = RawBodyRequest<{
  rawBody?: Buffer;
}>;

@Controller('api/v2/payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    @Optional() private readonly mercadoPagoService?: MercadoPagoService,
  ) {}

  @Post('webhook')
  processWebhook(
    @Req() request: RawPaymentRequest,
    @Headers('x-payment-signature') signature: string | undefined,
    @Body() body: unknown,
  ) {
    const payload = request.rawBody?.toString('utf8') ?? JSON.stringify(body);
    return this.paymentsService.processWebhook(payload, signature);
  }

  @Post('mercadopago/webhook/:slug')
  @UseGuards(PublicRateLimitGuard)
  @RateLimit({ limit: 60, windowMs: 60_000, keyPrefix: 'mp-webhook' })
  processMercadoPagoWebhook(
    @Param('slug') slug: string,
    @Body() body: unknown,
    @Query() query: Record<string, string | undefined>,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    if (!this.mercadoPagoService) {
      throw new Error('MercadoPagoService não inicializado');
    }
    return this.mercadoPagoService.processMerchantWebhook(slug, body, query, headers);
  }
}
