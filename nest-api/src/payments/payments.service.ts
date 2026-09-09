import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  NormalizedPaymentEvent,
  PAYMENT_GATEWAY_ADAPTER,
  PaymentGatewayAdapter,
} from './payment-gateway.adapter';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_GATEWAY_ADAPTER)
    private readonly gateway: PaymentGatewayAdapter,
  ) {}

  async processWebhook(
    payload: string,
    signature: string | undefined,
  ): Promise<{ duplicate: boolean }> {
    if (!this.gateway.verifyWebhookSignature(payload, signature)) {
      throw new UnauthorizedException('Assinatura do webhook inválida');
    }

    const event = this.gateway.normalizeWebhook(payload);

    try {
      await this.prisma.paymentWebhookEvent.create({
        data: {
          provider: 'configured',
          eventId: event.eventId,
          eventType: event.eventType,
          gatewayOrderId: event.gatewayOrderId,
          gatewayTransactionId: event.gatewayTransactionId,
          amount: event.amount,
          payload: this.parsePayload(payload),
        },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        return { duplicate: true };
      }
      throw error;
    }

    await this.reconcilePayment(event);
    return { duplicate: false };
  }

  private async reconcilePayment(event: NormalizedPaymentEvent): Promise<void> {
    const order = await this.prisma.order.findFirst({
      where: { gatewayOrderId: event.gatewayOrderId },
    });

    if (!order) {
      throw new NotFoundException('Pedido do gateway não encontrado');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          gatewayStatus: event.status,
          ...(event.status === 'PAID' ? { status: 'PAGO' } : {}),
        },
      });

      if (event.status === 'PAID' && event.gatewayTransactionId) {
        await tx.transaction.upsert({
          where: { legacyId: `gateway:${event.gatewayTransactionId}` },
          create: {
            userId: order.userId,
            orderId: order.id,
            type: 'VENDA',
            date: new Date(),
            amount: new Prisma.Decimal(event.amount ?? order.total),
            description: `Pagamento confirmado pelo gateway (${event.eventId})`,
            gatewayTransactionId: event.gatewayTransactionId,
            legacyId: `gateway:${event.gatewayTransactionId}`,
          },
          update: {
            gatewayTransactionId: event.gatewayTransactionId,
          },
        });
      }
    });
  }

  private parsePayload(payload: string): Prisma.InputJsonValue {
    try {
      return JSON.parse(payload) as Prisma.InputJsonValue;
    } catch {
      return { raw: payload };
    }
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }
}
