import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BillingActionType, SetupBatchTier, SetupRequestStatus, SubscriptionStatus } from '@prisma/client';
import { BillingCatalogService } from './billing-catalog.service';
import { BillingService } from './billing.service';

describe('BillingService (Assinatura & Order Bump Setup por Lote)', () => {
  const catalogService = new BillingCatalogService();
  let mockPrisma: any;
  let mockSubscriptionService: any;
  let service: BillingService;

  beforeEach(() => {
    process.env.SAAS_MONTHLY_PRICE_CENTS = '9700';
    process.env.SAAS_SETUP_BATCH_200_PRICE_CENTS = '14900';
    process.env.SAAS_SETUP_BATCH_300_PRICE_CENTS = '19900';
    process.env.SAAS_SETUP_BATCH_500_PRICE_CENTS = '29900';
    process.env.SAAS_SUPPORT_WHATSAPP = '5511999998888';

    mockPrisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'tenant-a',
          email: 'loja-a@teste.com',
          name: 'Lojista A',
          config: { storeName: 'Loja A Pratas', publicSlug: 'loja-a' },
        }),
      },
      productSetupRequest: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        create: jest.fn().mockImplementation(async ({ data }) => ({
          id: 'setup-req-1',
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
        update: jest.fn().mockImplementation(async ({ data }) => ({
          id: 'setup-req-1',
          ...data,
        })),
      },
      billingEvent: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'evt-1' }),
      },
      subscription: {
        upsert: jest.fn().mockImplementation(async ({ update, create }) => ({
          id: 'sub-a',
          userId: 'tenant-a',
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          ...update,
        })),
        update: jest.fn().mockImplementation(async ({ data }) => ({
          id: 'sub-a',
          userId: 'tenant-a',
          ...data,
        })),
      },
      config: {
        update: jest.fn().mockImplementation(async ({ data }) => ({
          userId: 'tenant-a',
          ...data,
        })),
      },
      $transaction: jest.fn(async (cb) => cb(mockPrisma)),
    };

    mockSubscriptionService = {
      ensureForUser: jest.fn().mockResolvedValue({
        id: 'sub-a',
        userId: 'tenant-a',
        status: SubscriptionStatus.TRIAL,
        planCode: 'PRO_MONTHLY',
        monthlyPriceCents: 9700,
        trialStartsAt: new Date('2026-11-01T00:00:00Z'),
        trialEndsAt: new Date('2026-11-15T00:00:00Z'),
        isExempt: false,
      }),
    };

    service = new BillingService(mockPrisma, catalogService, mockSubscriptionService);
  });

  afterEach(() => {
    delete process.env.SAAS_MONTHLY_PRICE_CENTS;
    delete process.env.SAAS_SETUP_BATCH_200_PRICE_CENTS;
    delete process.env.SAAS_SETUP_BATCH_300_PRICE_CENTS;
    delete process.env.SAAS_SETUP_BATCH_500_PRICE_CENTS;
    delete process.env.SAAS_SUPPORT_WHATSAPP;
  });

  it('cria checkout-intent com plano mensal + Order Bump UP_TO_300 somando valores no servidor', async () => {
    const result = await service.createCheckoutIntent('tenant-a', {
      setupBatchTier: SetupBatchTier.UP_TO_300,
      contactPhone: '11988887777',
      sourceDescription: 'Planilha com 280 anéis e brincos',
    });

    expect(result.monthlyPlanPriceCents).toBe(9700);
    expect(result.setupBatchTier).toBe(SetupBatchTier.UP_TO_300);
    expect(result.setupBatchMaxProducts).toBe(300);
    expect(result.setupPriceCents).toBe(19900);
    expect(result.totalPriceCents).toBe(29600);
    expect(result.setupRequestId).toBe('setup-req-1');
    expect(result.whatsappMessage).toContain('Loja A Pratas');
    expect(result.whatsappMessage).toContain('300');
    expect(result.whatsappUrl).toContain('https://wa.me/5511999998888');
    expect(mockPrisma.productSetupRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'tenant-a',
          batchTier: SetupBatchTier.UP_TO_300,
          includeMonthlyPlan: true,
          totalPriceCents: 29600,
        }),
      }),
    );
    expect(mockPrisma.billingEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: BillingActionType.CHECKOUT_INTENT_CREATED,
          amountCents: 29600,
        }),
      }),
    );
  });

  it('cria checkout-intent apenas do plano mensal sem registrar ProductSetupRequest', async () => {
    const result = await service.createCheckoutIntent('tenant-a', {});

    expect(result.totalPriceCents).toBe(9700);
    expect(result.setupRequestId).toBeNull();
    expect(mockPrisma.productSetupRequest.create).not.toHaveBeenCalled();
  });

  it('cria checkout-intent somando plano mensal + Order Bump do Gateway Integrado no Catálogo', async () => {
    const result = await service.createCheckoutIntent('tenant-a', {
      includeGatewayAddon: true,
    });

    // 9700 (plano) + 4900 (addon gateway) = 14600
    expect(result.monthlyPlanPriceCents).toBe(9700);
    expect(result.includeGatewayAddon).toBe(true);
    expect(result.gatewayAddonPriceCents).toBe(4900);
    expect(result.totalPriceCents).toBe(14600);
    expect(result.whatsappMessage).toContain('Gateway no Catálogo');
    expect(mockPrisma.billingEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: BillingActionType.CHECKOUT_INTENT_CREATED,
          amountCents: 14600,
        }),
      }),
    );
  });

  it('permite contratar setup avulso (UP_TO_200) durante o trial sem somar mensalidade', async () => {
    const result = await service.createSetupRequest('tenant-a', {
      batchTier: SetupBatchTier.UP_TO_200,
      includeMonthlyPlan: false,
    });

    expect(result.maxProducts).toBe(200);
    expect(result.priceCents).toBe(14900);
    expect(result.totalPriceCents).toBe(14900);
    expect(result.includeMonthlyPlan).toBe(false);
  });

  it('rejeita cancelamento de solicitação pertencente a outro tenant com NotFoundException (404)', async () => {
    mockPrisma.productSetupRequest.findFirst.mockResolvedValue(null);

    await expect(service.cancelSetupRequest('req-tenant-a', 'tenant-b')).rejects.toThrow(
      NotFoundException,
    );
    expect(mockPrisma.productSetupRequest.findFirst).toHaveBeenCalledWith({
      where: { id: 'req-tenant-a', userId: 'tenant-b' },
    });
    expect(mockPrisma.productSetupRequest.update).not.toHaveBeenCalled();
  });

  it('rejeita cancelamento de solicitação já paga ou concluída com BadRequestException (400)', async () => {
    mockPrisma.productSetupRequest.findFirst.mockResolvedValue({
      id: 'req-1',
      userId: 'tenant-a',
      status: SetupRequestStatus.PAID,
      referenceCode: 'HIVE-SETUP-123',
    });

    await expect(service.cancelSetupRequest('req-1', 'tenant-a')).rejects.toThrow(
      BadRequestException,
    );
    expect(mockPrisma.productSetupRequest.update).not.toHaveBeenCalled();
  });

  describe('processWebhook (Processamento Anti-Fraude & Idempotência)', () => {
    it('ativa a assinatura e estende por 30 dias ao receber PAYMENT_RECEIVED com valor válido', async () => {
      const result = await service.processWebhook({
        id: 'evt_pay_123',
        event: 'PAYMENT_RECEIVED',
        payment: {
          id: 'pay_123',
          value: 97.0,
          status: 'RECEIVED',
          billingType: 'PIX',
        },
        metadata: {
          userId: 'tenant-a',
          planCode: 'PRO_MONTHLY',
        },
      });

      expect(result.success).toBe(true);
      expect(result.activated).toBe(true);
      expect(result.extendedDays).toBe(30);

      expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'tenant-a' },
          update: expect.objectContaining({
            status: SubscriptionStatus.ACTIVE,
          }),
        }),
      );

      expect(mockPrisma.billingEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'tenant-a',
            action: BillingActionType.SUBSCRIPTION_ACTIVATED,
            amountCents: 9700,
            referenceCode: 'evt_pay_123',
          }),
        }),
      );
    });

    it('ativa o Add-on de Gateway no Catálogo se includeGatewayAddon for verdadeiro', async () => {
      await service.processWebhook({
        id: 'evt_pay_addon',
        event: 'PAYMENT_CONFIRMED',
        payment: {
          id: 'pay_addon',
          value: 146.0,
          status: 'CONFIRMED',
        },
        metadata: {
          userId: 'tenant-a',
          includeGatewayAddon: true,
        },
      });

      expect(mockPrisma.config.update).toHaveBeenCalledWith({
        where: { userId: 'tenant-a' },
        data: { hasGatewayAddon: true },
      });
    });

    it('rejeita com alerta anti-fraude se o valor pago for menor do que o plano (adulteração)', async () => {
      const result = await service.processWebhook({
        id: 'evt_hack',
        event: 'PAYMENT_RECEIVED',
        payment: {
          id: 'pay_hack',
          value: 10.0,
          status: 'RECEIVED',
        },
        metadata: {
          userId: 'tenant-a',
        },
      });

      expect(result.success).toBe(false);
      expect(result.flagged).toBe(true);
      expect(mockPrisma.subscription.upsert).not.toHaveBeenCalled();

      expect(mockPrisma.billingEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'tenant-a',
            action: BillingActionType.ACCOUNT_SUSPENDED,
            note: expect.stringContaining('ALERTA ANTI-FRAUDE'),
          }),
        }),
      );
    });

    it('garante idempotência em Replay Attack (retorna 200 sem duplicar dias se evento já processado)', async () => {
      mockPrisma.billingEvent.findFirst.mockResolvedValueOnce({
        id: 'existing-evt',
        referenceCode: 'evt_replay',
      });

      const result = await service.processWebhook({
        id: 'evt_replay',
        event: 'PAYMENT_RECEIVED',
        payment: { id: 'pay_replay', value: 97.0 },
        metadata: { userId: 'tenant-a' },
      });

      expect(result.idempotent).toBe(true);
      expect(result.success).toBe(true);
      expect(mockPrisma.subscription.upsert).not.toHaveBeenCalled();
    });

    it('marca como EXPIRED se o evento for PAYMENT_OVERDUE e período estiver expirado', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'tenant-a',
        subscription: {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: new Date('2026-11-01T00:00:00Z'),
        },
      });

      const result = await service.processWebhook({
        id: 'evt_overdue',
        event: 'PAYMENT_OVERDUE',
        payment: { id: 'pay_overdue', value: 97.0 },
        metadata: { userId: 'tenant-a' },
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { userId: 'tenant-a' },
        data: { status: SubscriptionStatus.EXPIRED },
      });
    });

    it('marca como CANCELED e desativa o Addon no evento PAYMENT_REFUNDED', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'tenant-a',
        config: { hasGatewayAddon: true },
        subscription: { status: SubscriptionStatus.ACTIVE },
      });

      const result = await service.processWebhook({
        id: 'evt_refund',
        event: 'PAYMENT_REFUNDED',
        payment: { id: 'pay_refund', value: 97.0 },
        metadata: { userId: 'tenant-a' },
      });

      expect(result.canceled).toBe(true);
      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { userId: 'tenant-a' },
        data: { status: SubscriptionStatus.CANCELED },
      });
      expect(mockPrisma.config.update).toHaveBeenCalledWith({
        where: { userId: 'tenant-a' },
        data: { hasGatewayAddon: false },
      });
    });
  });
});
