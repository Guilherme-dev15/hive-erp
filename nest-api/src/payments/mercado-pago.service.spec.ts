import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { OrderStatus, PaymentMethod, Prisma } from '@prisma/client';
import { createHmac } from 'node:crypto';
import { encryptSecret } from '../common/crypto.util';
import { MercadoPagoService } from './mercado-pago.service';

describe('MercadoPagoService', () => {
  let service: MercadoPagoService;
  let prisma: {
    config: { findFirst: jest.Mock };
    order: { findFirst: jest.Mock; update: jest.Mock };
    paymentWebhookEvent: { create: jest.Mock };
    transaction: { upsert: jest.Mock };
    $transaction: jest.Mock;
  };
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    process.env.NODE_ENV = 'test';
    process.env.GATEWAY_TOKEN_ENCRYPTION_KEY = 'chave-teste-mercado-pago-32bytes';
    prisma = {
      config: { findFirst: jest.fn() },
      order: { findFirst: jest.fn(), update: jest.fn() },
      paymentWebhookEvent: { create: jest.fn() },
      transaction: { upsert: jest.fn() },
      $transaction: jest.fn(async (cb: (tx: typeof prisma) => Promise<void>) => cb(prisma)),
    };
    service = new MercadoPagoService(prisma as never);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('cria preferência Checkout Pro no Mercado Pago descriptografando o Access Token', async () => {
    const encrypted = encryptSecret('APP_USR-merchant-token-123');
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: 'pref-999',
        init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-999',
      }),
    });
    global.fetch = fetchMock as any;

    const result = await service.createCheckoutPreference({
      orderId: 'ord-111',
      storeName: 'Hive Pratas',
      slug: 'hive',
      customerName: 'Maria',
      encryptedAccessToken: encrypted,
      items: [{ id: 'prod-1', title: 'Anel Solitário', quantity: 2, unitPrice: 120 }],
      returnBaseUrl: 'https://hive.hiveerp.com.br',
    });

    expect(result).toEqual({
      preferenceId: 'pref-999',
      paymentUrl: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-999',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.mercadopago.com/checkout/preferences',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer APP_USR-merchant-token-123',
        }),
      }),
    );
    const bodySent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(bodySent.external_reference).toBe('ord-111');
    expect(bodySent.notification_url).toBe('https://app.hiveerp.com.br/api/v2/payments/mercadopago/webhook/hive');
    expect(bodySent.back_urls.success).toBe('https://hive.hiveerp.com.br/?pagamento=aprovado&pedido=ord-111');
  });

  it('valida assinatura x-signature e consulta pagamento server-to-server aprovando pedido e lançando financeiro', async () => {
    const encryptedToken = encryptSecret('APP_USR-merchant-token-123');
    const webhookSecret = 'segredo-webhook-mp';
    const encryptedSecret = encryptSecret(webhookSecret);
    const paymentId = '888777666';
    const ts = '1732620000';
    const requestId = 'req-mp-1';
    const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;
    const v1 = createHmac('sha256', webhookSecret).update(manifest).digest('hex');

    prisma.config.findFirst.mockResolvedValue({
      userId: 'tenant-1',
      hasGatewayAddon: true,
      gatewayAccessToken: encryptedToken,
      gatewayWebhookSecret: encryptedSecret,
    });
    prisma.order.findFirst.mockResolvedValue({
      id: 'ord-111',
      userId: 'tenant-1',
      total: 240,
      gatewayOrderId: 'pref-999',
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: paymentId,
        status: 'approved',
        external_reference: 'ord-111',
        transaction_amount: 240,
        payment_method_id: 'pix',
      }),
    }) as any;

    const result = await service.processMerchantWebhook(
      'hive',
      { type: 'payment', data: { id: paymentId } },
      {},
      { 'x-signature': `ts=${ts},v1=${v1}`, 'x-request-id': requestId },
    );

    expect(result).toEqual({ duplicate: false, status: 'PAID' });
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'ord-111' },
      data: {
        gatewayStatus: 'PAID',
        status: OrderStatus.PAGO,
        paymentMethod: PaymentMethod.PIX,
        financialRegistered: true,
      },
    });
    expect(prisma.transaction.upsert).toHaveBeenCalledTimes(1);
  });

  it('rejeita webhook quando assinatura x-signature é inválida', async () => {
    prisma.config.findFirst.mockResolvedValue({
      userId: 'tenant-1',
      hasGatewayAddon: true,
      gatewayAccessToken: encryptSecret('APP_USR-token'),
      gatewayWebhookSecret: encryptSecret('segredo-correto'),
    });

    await expect(
      service.processMerchantWebhook(
        'hive',
        { type: 'payment', data: { id: '12345' } },
        {},
        { 'x-signature': 'ts=123,v1=assinatura_invalida', 'x-request-id': 'req-1' },
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('bloqueia ativação como PAGO quando o valor pago no MP é menor que o total do pedido', async () => {
    prisma.config.findFirst.mockResolvedValue({
      userId: 'tenant-1',
      hasGatewayAddon: true,
      gatewayAccessToken: encryptSecret('APP_USR-token'),
      gatewayWebhookSecret: null,
    });
    prisma.order.findFirst.mockResolvedValue({
      id: 'ord-111',
      userId: 'tenant-1',
      total: 240,
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: '999',
        status: 'approved',
        external_reference: 'ord-111',
        transaction_amount: 10,
        payment_method_id: 'pix',
      }),
    }) as any;

    const result = await service.processMerchantWebhook('hive', { type: 'payment', data: { id: '999' } }, {}, {});
    expect(result).toEqual({ duplicate: false, status: 'AMOUNT_MISMATCH' });
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'ord-111' },
      data: { gatewayStatus: 'AMOUNT_MISMATCH' },
    });
    expect(prisma.transaction.upsert).not.toHaveBeenCalled();
  });

  it('retorna duplicate=true em evento já processado (idempotência)', async () => {
    prisma.config.findFirst.mockResolvedValue({
      userId: 'tenant-1',
      hasGatewayAddon: true,
      gatewayAccessToken: encryptSecret('APP_USR-token'),
      gatewayWebhookSecret: null,
    });
    prisma.order.findFirst.mockResolvedValue({
      id: 'ord-111',
      userId: 'tenant-1',
      total: 240,
    });
    prisma.paymentWebhookEvent.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '5.22.0' }),
    );
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: '999',
        status: 'approved',
        external_reference: 'ord-111',
        transaction_amount: 240,
      }),
    }) as any;

    await expect(
      service.processMerchantWebhook('hive', { type: 'payment', data: { id: '999' } }, {}, {}),
    ).resolves.toEqual({ duplicate: true });
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it('lança NotFoundException quando a loja não possui gateway ativo', async () => {
    prisma.config.findFirst.mockResolvedValue({
      userId: 'tenant-1',
      hasGatewayAddon: false,
      gatewayAccessToken: null,
    });

    await expect(
      service.processMerchantWebhook('hive', { type: 'payment', data: { id: '999' } }, {}, {}),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
