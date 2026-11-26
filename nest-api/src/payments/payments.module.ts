import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MercadoPagoService } from './mercado-pago.service';
import { PublicRateLimitGuard } from '../common/public-rate-limit.guard';
import {
  PAYMENT_GATEWAY_ADAPTER,
  UnconfiguredPaymentGatewayAdapter,
} from './payment-gateway.adapter';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    MercadoPagoService,
    PublicRateLimitGuard,
    {
      provide: PAYMENT_GATEWAY_ADAPTER,
      useClass: UnconfiguredPaymentGatewayAdapter,
    },
  ],
  exports: [MercadoPagoService],
})
export class PaymentsModule {}
