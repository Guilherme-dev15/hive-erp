import { Body, Controller, Headers, Post, RawBodyRequest, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';

type RawPaymentRequest = RawBodyRequest<{
  rawBody?: Buffer;
}>;

@Controller('api/v2/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('webhook')
  processWebhook(
    @Req() request: RawPaymentRequest,
    @Headers('x-payment-signature') signature: string | undefined,
    @Body() body: unknown,
  ) {
    const payload = request.rawBody?.toString('utf8') ?? JSON.stringify(body);
    return this.paymentsService.processWebhook(payload, signature);
  }
}
