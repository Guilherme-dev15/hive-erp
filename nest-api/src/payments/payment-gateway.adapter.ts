import { Injectable } from '@nestjs/common';

export type PaymentEventStatus = 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';

export interface NormalizedPaymentEvent {
  eventId: string;
  eventType: string;
  status: PaymentEventStatus;
  gatewayOrderId: string;
  gatewayTransactionId?: string;
  amount?: number;
}

export interface PaymentGatewayAdapter {
  verifyWebhookSignature(payload: string, signature: string | undefined): boolean;
  normalizeWebhook(payload: string): NormalizedPaymentEvent;
}

export const PAYMENT_GATEWAY_ADAPTER = Symbol('PAYMENT_GATEWAY_ADAPTER');

/**
 * The application does not accept provider payloads until a provider adapter
 * is explicitly configured. This prevents an unsigned/unknown webhook from
 * changing financial state by default.
 */
@Injectable()
export class UnconfiguredPaymentGatewayAdapter implements PaymentGatewayAdapter {
  verifyWebhookSignature(): boolean {
    return false;
  }

  normalizeWebhook(): NormalizedPaymentEvent {
    throw new Error('Nenhum adaptador de gateway configurado');
  }
}
