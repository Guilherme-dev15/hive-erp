import { UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { PaymentGatewayAdapter } from './payment-gateway.adapter';

describe('PaymentsService', () => {
  const event = {
    eventId: 'evt-1',
    eventType: 'payment.updated',
    status: 'PAID' as const,
    gatewayOrderId: 'gateway-order-1',
    gatewayTransactionId: 'gateway-tx-1',
    amount: 150,
  };

  let service: PaymentsService;
  let prisma: {
    paymentWebhookEvent: { create: jest.Mock };
    order: { findFirst: jest.Mock; update: jest.Mock };
    transaction: { upsert: jest.Mock };
    $transaction: jest.Mock;
  };
  let adapter: jest.Mocked<PaymentGatewayAdapter>;

  beforeEach(() => {
    prisma = {
      paymentWebhookEvent: { create: jest.fn() },
      order: { findFirst: jest.fn(), update: jest.fn() },
      transaction: { upsert: jest.fn() },
      $transaction: jest.fn(async (callback: (tx: typeof prisma) => Promise<void>) => callback(prisma)),
    };
    adapter = {
      verifyWebhookSignature: jest.fn(),
      normalizeWebhook: jest.fn(),
    };
    service = new PaymentsService(prisma as never, adapter);
  });

  it('rejeita webhook sem assinatura válida antes de persistir qualquer estado', async () => {
    adapter.verifyWebhookSignature.mockReturnValue(false);

    await expect(service.processWebhook('{"id":"evt-1"}', undefined)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.paymentWebhookEvent.create).not.toHaveBeenCalled();
  });

  it('processa evento válido, atualiza o pedido e cria a transação uma única vez', async () => {
    adapter.verifyWebhookSignature.mockReturnValue(true);
    adapter.normalizeWebhook.mockReturnValue(event);
    prisma.order.findFirst.mockResolvedValue({
      id: 'order-1',
      userId: 'user-1',
      total: 150,
      gatewayOrderId: event.gatewayOrderId,
    });

    await expect(service.processWebhook(JSON.stringify(event), 'valid-signature')).resolves.toEqual({
      duplicate: false,
    });
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { gatewayStatus: 'PAID', status: 'PAGO' },
    });
    expect(prisma.transaction.upsert).toHaveBeenCalledTimes(1);
  });

  it('não reaplica evento já registrado pelo par provider/eventId', async () => {
    adapter.verifyWebhookSignature.mockReturnValue(true);
    adapter.normalizeWebhook.mockReturnValue(event);
    prisma.paymentWebhookEvent.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '5.22.0',
      }),
    );

    await expect(service.processWebhook(JSON.stringify(event), 'valid-signature')).resolves.toEqual({
      duplicate: true,
    });
    expect(prisma.order.findFirst).not.toHaveBeenCalled();
  });
});
