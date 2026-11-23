import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SetupBatchTier, SetupRequestStatus, SubscriptionStatus } from '@prisma/client';
import { BillingCatalogService } from '../billing/billing-catalog.service';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminSubscriptionAction } from './dto/update-tenant-subscription.dto';

describe('SuperAdminService', () => {
  const catalogService = new BillingCatalogService();
  let mockPrisma: any;
  let mockSubscriptionService: any;
  let mockProductsService: any;
  let service: SuperAdminService;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      subscription: {
        findUnique: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
      },
      productSetupRequest: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      billingEvent: {
        create: jest.fn().mockResolvedValue({ id: 'evt-1' }),
      },
      $transaction: jest.fn(async (cb) => cb(mockPrisma)),
    };

    mockSubscriptionService = {
      ensureForUser: jest.fn().mockResolvedValue({ id: 'sub-1' }),
    };

    mockProductsService = {
      importBulk: jest.fn().mockResolvedValue({ count: 2 }),
    };

    service = new SuperAdminService(
      mockPrisma,
      catalogService,
      mockSubscriptionService,
      mockProductsService,
    );
  });

  it('soma +30 dias a partir do currentPeriodEnd vigente quando renovação é antecipada', async () => {
    const futureEnd = new Date(Date.now() + 10 * 86_400_000);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'tenant-1',
      email: 'lojista@pratas.com',
      active: true,
    });
    mockPrisma.subscription.findUnique.mockResolvedValue({
      id: 'sub-1',
      userId: 'tenant-1',
      status: SubscriptionStatus.ACTIVE,
      planCode: 'PRO_MONTHLY',
      monthlyPriceCents: 9700,
      trialStartsAt: new Date(),
      trialEndsAt: new Date(),
      currentPeriodStart: new Date(),
      currentPeriodEnd: futureEnd,
      activatedAt: new Date(),
      canceledAt: null,
      isExempt: false,
      lastPaymentNote: null,
    });
    mockPrisma.subscription.update.mockImplementation(async ({ data }) => ({
      id: 'sub-1',
      userId: 'tenant-1',
      planCode: 'PRO_MONTHLY',
      monthlyPriceCents: 9700,
      trialStartsAt: new Date(),
      trialEndsAt: new Date(),
      ...data,
    }));

    const result = await service.updateTenantSubscription(
      'tenant-1',
      { action: SuperAdminSubscriptionAction.ACTIVATE_MONTHLY, days: 30, note: 'Pix verificado' },
      'admin-1',
    );

    const expectedMin = futureEnd.getTime() + 29 * 86_400_000;
    expect(result.subscription.effectiveStatus).toBe(SubscriptionStatus.ACTIVE);
    expect(new Date(result.subscription.currentPeriodEnd!).getTime()).toBeGreaterThan(expectedMin);
    expect(mockPrisma.billingEvent.create).toHaveBeenCalledTimes(1);
  });

  it('impede auto-suspensão ou bloqueio de conta da allowlist admin', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'admin-1',
      email: 'guibanks1@gmail.com',
      active: true,
    });

    await expect(
      service.updateTenantSubscription(
        'admin-1',
        { action: SuperAdminSubscriptionAction.SUSPEND_ACCOUNT },
        'admin-1',
      ),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.updateTenantSubscription(
        'admin-1',
        { action: SuperAdminSubscriptionAction.EXPIRE_NOW },
        'admin-2',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('ativa assinatura mensal atomicamente ao confirmar pagamento de Order Bump combinado', async () => {
    mockPrisma.productSetupRequest.findUnique.mockResolvedValue({
      id: 'setup-1',
      userId: 'tenant-1',
      batchTier: SetupBatchTier.UP_TO_200,
      maxProducts: 200,
      priceCents: 14900,
      includeMonthlyPlan: true,
      monthlyPlanPriceCents: 9700,
      status: SetupRequestStatus.PENDING,
      referenceCode: 'HIVE-BUMP-20261111-AA11',
      adminNotes: null,
      importedCount: null,
      paidAt: null,
      startedAt: null,
      completedAt: null,
      canceledAt: null,
    });
    mockPrisma.productSetupRequest.update.mockImplementation(async ({ data }) => ({
      id: 'setup-1',
      ...data,
    }));
    mockPrisma.subscription.findUnique.mockResolvedValue(null);
    mockPrisma.subscription.upsert.mockImplementation(async ({ create }) => ({
      id: 'sub-new',
      ...create,
    }));

    const result = await service.updateSetupRequest(
      'setup-1',
      {
        status: SetupRequestStatus.PAID,
        activateMonthlyPlanToo: true,
        adminNotes: 'Pix combinado recebido',
      },
      'admin-1',
    );

    expect(result.setupRequest.status).toBe(SetupRequestStatus.PAID);
    expect(result.activatedSubscription?.effectiveStatus).toBe(SubscriptionStatus.ACTIVE);
    expect(mockPrisma.billingEvent.create).toHaveBeenCalledTimes(2);
  });

  it('importa produtos para a loja alvo e vincula importedCount somente quando setupRequest pertence ao mesmo tenant', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'tenant-1' });
    mockPrisma.productSetupRequest.findFirst.mockResolvedValue(null);

    await expect(
      service.importProductsForTenant(
        'tenant-1',
        {
          products: [{ name: 'Anel Solitário', salePrice: 99 }],
          setupRequestId: 'setup-de-outro-tenant',
        },
        'admin-1',
      ),
    ).rejects.toThrow(NotFoundException);

    expect(mockProductsService.importBulk).not.toHaveBeenCalled();

    mockPrisma.productSetupRequest.findFirst.mockResolvedValue({
      id: 'setup-tenant-1',
      userId: 'tenant-1',
    });
    mockPrisma.productSetupRequest.update.mockResolvedValue({
      id: 'setup-tenant-1',
      importedCount: 2,
    });

    const okResult = await service.importProductsForTenant(
      'tenant-1',
      {
        products: [{ name: 'Anel Solitário', salePrice: 99 }, { name: 'Brinco Prata', salePrice: 59 }],
        setupRequestId: 'setup-tenant-1',
      },
      'admin-1',
    );

    expect(okResult).toEqual({ count: 2 });
    expect(mockProductsService.importBulk).toHaveBeenCalledWith(expect.any(Array), 'tenant-1');
    expect(mockPrisma.productSetupRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'setup-tenant-1' },
        data: expect.objectContaining({ importedCount: 2 }),
      }),
    );
  });
});
