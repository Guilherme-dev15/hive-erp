import { SubscriptionStatus } from '@prisma/client';
import { BillingCatalogService } from './billing-catalog.service';
import { evaluateSubscriptionAccess, SubscriptionService } from './subscription.service';

describe('SubscriptionService', () => {
  const catalogService = new BillingCatalogService();

  describe('evaluateSubscriptionAccess (função pura)', () => {
    const baseSub = {
      planCode: 'PRO_MONTHLY',
      monthlyPriceCents: 9700,
      trialStartsAt: new Date('2026-11-01T12:00:00Z'),
      trialEndsAt: new Date('2026-11-15T12:00:00Z'),
      currentPeriodStart: null,
      currentPeriodEnd: null,
      isExempt: false,
    };

    it('libera TRIAL dentro do prazo calculando daysRemaining', () => {
      const now = new Date('2026-11-11T12:00:00Z');
      const access = evaluateSubscriptionAccess(
        { ...baseSub, status: SubscriptionStatus.TRIAL },
        now,
      );

      expect(access.effectiveStatus).toBe(SubscriptionStatus.TRIAL);
      expect(access.isBlocked).toBe(false);
      expect(access.daysRemaining).toBe(4);
    });

    it('bloqueia TRIAL exatamente no timestamp limite (effectiveStatus EXPIRED)', () => {
      const exactExpiry = new Date('2026-11-15T12:00:00Z');
      const access = evaluateSubscriptionAccess(
        { ...baseSub, status: SubscriptionStatus.TRIAL },
        exactExpiry,
      );

      expect(access.effectiveStatus).toBe(SubscriptionStatus.EXPIRED);
      expect(access.isBlocked).toBe(true);
      expect(access.daysRemaining).toBe(0);
    });

    it('libera ACTIVE dentro do período pago e bloqueia quando currentPeriodEnd expira', () => {
      const periodEnd = new Date('2026-12-10T12:00:00Z');
      const activeAccess = evaluateSubscriptionAccess(
        {
          ...baseSub,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date('2026-11-10T12:00:00Z'),
          currentPeriodEnd: periodEnd,
        },
        new Date('2026-11-20T12:00:00Z'),
      );

      expect(activeAccess.effectiveStatus).toBe(SubscriptionStatus.ACTIVE);
      expect(activeAccess.isBlocked).toBe(false);
      expect(activeAccess.daysRemaining).toBe(20);

      const expiredAccess = evaluateSubscriptionAccess(
        {
          ...baseSub,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date('2026-11-10T12:00:00Z'),
          currentPeriodEnd: periodEnd,
        },
        new Date('2026-12-11T00:00:00Z'),
      );

      expect(expiredAccess.effectiveStatus).toBe(SubscriptionStatus.EXPIRED);
      expect(expiredAccess.isBlocked).toBe(true);
      expect(expiredAccess.daysRemaining).toBe(0);
    });

    it('sempre libera contas isExempt mesmo com datas vencidas', () => {
      const access = evaluateSubscriptionAccess(
        {
          ...baseSub,
          status: SubscriptionStatus.TRIAL,
          isExempt: true,
        },
        new Date('2030-01-01T00:00:00Z'),
      );

      expect(access.effectiveStatus).toBe(SubscriptionStatus.ACTIVE);
      expect(access.isBlocked).toBe(false);
      expect(access.isExempt).toBe(true);
      expect(access.daysRemaining).toBeNull();
    });

    it('bloqueia CANCELED e EXPIRED imediatamente', () => {
      const canceled = evaluateSubscriptionAccess(
        { ...baseSub, status: SubscriptionStatus.CANCELED },
        new Date('2026-11-05T00:00:00Z'),
      );
      expect(canceled.effectiveStatus).toBe(SubscriptionStatus.CANCELED);
      expect(canceled.isBlocked).toBe(true);
    });
  });

  describe('ensureForUser', () => {
    it('provisiona TRIAL de 14 dias e grava BillingEvent TRIAL_STARTED quando usuário não tem assinatura', async () => {
      const mockPrisma: any = {
        subscription: {
          findUnique: jest.fn().mockResolvedValue(null),
          upsert: jest.fn().mockImplementation(async ({ create }) => ({ id: 'sub-1', ...create })),
        },
        billingEvent: {
          create: jest.fn().mockResolvedValue({ id: 'evt-1' }),
        },
      };

      const service = new SubscriptionService(mockPrisma, catalogService);
      const sub = await service.ensureForUser('tenant-1', false);

      expect(sub.status).toBe(SubscriptionStatus.TRIAL);
      expect(sub.isExempt).toBe(false);
      const diffDays = Math.round(
        (new Date(sub.trialEndsAt).getTime() - new Date(sub.trialStartsAt).getTime()) / 86_400_000,
      );
      expect(diffDays).toBe(14);
      expect(mockPrisma.billingEvent.create).toHaveBeenCalledTimes(1);
    });

    it('promove assinatura de super-admin para ACTIVE + isExempt sem bloquear', async () => {
      const mockPrisma: any = {
        subscription: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'sub-admin',
            userId: 'admin-1',
            status: SubscriptionStatus.TRIAL,
            isExempt: false,
            activatedAt: null,
          }),
          update: jest.fn().mockImplementation(async ({ data }) => ({
            id: 'sub-admin',
            userId: 'admin-1',
            ...data,
          })),
        },
      };

      const service = new SubscriptionService(mockPrisma, catalogService);
      const sub = await service.ensureForUser('admin-1', true);

      expect(sub.isExempt).toBe(true);
      expect(sub.status).toBe(SubscriptionStatus.ACTIVE);
    });
  });
});
