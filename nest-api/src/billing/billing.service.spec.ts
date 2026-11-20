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
        create: jest.fn().mockResolvedValue({ id: 'evt-1' }),
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
});
