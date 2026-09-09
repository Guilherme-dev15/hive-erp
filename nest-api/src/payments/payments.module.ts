import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import {
  PAYMENT_GATEWAY_ADAPTER,
  UnconfiguredPaymentGatewayAdapter,
} from './payment-gateway.adapter';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    {
      provide: PAYMENT_GATEWAY_ADAPTER,
      useClass: UnconfiguredPaymentGatewayAdapter,
    },
  ],
})
export class PaymentsModule {}
