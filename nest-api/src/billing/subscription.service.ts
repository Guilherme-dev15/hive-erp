import { Injectable } from '@nestjs/common';
import { BillingActionType, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BillingCatalogService } from './billing-catalog.service';
import { SubscriptionAccessSummary } from './billing.types';

const MS_PER_DAY = 86_400_000;

export interface SubscriptionRecordLike {
  status: SubscriptionStatus;
  planCode: string;
  monthlyPriceCents: number;
  trialStartsAt: Date | string;
  trialEndsAt: Date | string;
  currentPeriodStart?: Date | string | null;
  currentPeriodEnd?: Date | string | null;
  isExempt: boolean;
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export function evaluateSubscriptionAccess(
  subscription: SubscriptionRecordLike,
  now: Date = new Date(),
): SubscriptionAccessSummary {
  const trialStartsAt = toDate(subscription.trialStartsAt) ?? now;
  const trialEndsAt = toDate(subscription.trialEndsAt) ?? now;
  const currentPeriodStart = toDate(subscription.currentPeriodStart);
  const currentPeriodEnd = toDate(subscription.currentPeriodEnd);

  if (subscription.isExempt) {
    return {
      status: subscription.status,
      effectiveStatus: SubscriptionStatus.ACTIVE,
      isBlocked: false,
      isExempt: true,
      planCode: subscription.planCode,
      monthlyPriceCents: subscription.monthlyPriceCents,
      trialStartsAt,
      trialEndsAt,
      currentPeriodStart,
      currentPeriodEnd,
      daysRemaining: null,
    };
  }

  if (
    subscription.status === SubscriptionStatus.CANCELED ||
    subscription.status === SubscriptionStatus.EXPIRED
  ) {
    return {
      status: subscription.status,
      effectiveStatus: subscription.status,
      isBlocked: true,
      isExempt: false,
      planCode: subscription.planCode,
      monthlyPriceCents: subscription.monthlyPriceCents,
      trialStartsAt,
      trialEndsAt,
      currentPeriodStart,
      currentPeriodEnd,
      daysRemaining: 0,
    };
  }

  if (subscription.status === SubscriptionStatus.TRIAL) {
    const diffMs = trialEndsAt.getTime() - now.getTime();
    if (diffMs <= 0) {
      return {
        status: subscription.status,
        effectiveStatus: SubscriptionStatus.EXPIRED,
        isBlocked: true,
        isExempt: false,
        planCode: subscription.planCode,
        monthlyPriceCents: subscription.monthlyPriceCents,
        trialStartsAt,
        trialEndsAt,
        currentPeriodStart,
        currentPeriodEnd,
        daysRemaining: 0,
      };
    }

    return {
      status: subscription.status,
      effectiveStatus: SubscriptionStatus.TRIAL,
      isBlocked: false,
      isExempt: false,
      planCode: subscription.planCode,
      monthlyPriceCents: subscription.monthlyPriceCents,
      trialStartsAt,
      trialEndsAt,
      currentPeriodStart,
      currentPeriodEnd,
      daysRemaining: Math.max(1, Math.ceil(diffMs / MS_PER_DAY)),
    };
  }

  // SubscriptionStatus.ACTIVE
  if (currentPeriodEnd) {
    const diffMs = currentPeriodEnd.getTime() - now.getTime();
    if (diffMs <= 0) {
      return {
        status: subscription.status,
        effectiveStatus: SubscriptionStatus.EXPIRED,
        isBlocked: true,
        isExempt: false,
        planCode: subscription.planCode,
        monthlyPriceCents: subscription.monthlyPriceCents,
        trialStartsAt,
        trialEndsAt,
        currentPeriodStart,
        currentPeriodEnd,
        daysRemaining: 0,
      };
    }

    return {
      status: subscription.status,
      effectiveStatus: SubscriptionStatus.ACTIVE,
      isBlocked: false,
      isExempt: false,
      planCode: subscription.planCode,
      monthlyPriceCents: subscription.monthlyPriceCents,
      trialStartsAt,
      trialEndsAt,
      currentPeriodStart,
      currentPeriodEnd,
      daysRemaining: Math.max(1, Math.ceil(diffMs / MS_PER_DAY)),
    };
  }

  return {
    status: subscription.status,
    effectiveStatus: SubscriptionStatus.ACTIVE,
    isBlocked: false,
    isExempt: false,
    planCode: subscription.planCode,
    monthlyPriceCents: subscription.monthlyPriceCents,
    trialStartsAt,
    trialEndsAt,
    currentPeriodStart,
    currentPeriodEnd,
    daysRemaining: null,
  };
}

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogService: BillingCatalogService,
  ) {}

  buildTrialDates(now: Date = new Date()): { trialStartsAt: Date; trialEndsAt: Date } {
    const trialDays = this.catalogService.getTrialDays();
    return {
      trialStartsAt: now,
      trialEndsAt: new Date(now.getTime() + trialDays * MS_PER_DAY),
    };
  }

  getOnboardingDefaults() {
    return {
      planCode: this.catalogService.getMonthlyPlanCode(),
      monthlyPriceCents: this.catalogService.getMonthlyPriceCents(),
      trialDays: this.catalogService.getTrialDays(),
    };
  }

  async ensureForUser(userId: string, isSuperAdmin = false) {
    const existing = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (existing) {
      if (isSuperAdmin && !existing.isExempt) {
        return this.prisma.subscription.update({
          where: { userId },
          data: {
            isExempt: true,
            status: SubscriptionStatus.ACTIVE,
            activatedAt: existing.activatedAt ?? new Date(),
          },
        });
      }
      return existing;
    }

    const now = new Date();
    const { trialStartsAt, trialEndsAt } = this.buildTrialDates(now);
    const planCode = this.catalogService.getMonthlyPlanCode();
    const monthlyPriceCents = this.catalogService.getMonthlyPriceCents();

    const created = await this.prisma.subscription.upsert({
      where: { userId },
      update: isSuperAdmin
        ? {
            isExempt: true,
            status: SubscriptionStatus.ACTIVE,
            activatedAt: now,
          }
        : {},
      create: {
        userId,
        status: isSuperAdmin ? SubscriptionStatus.ACTIVE : SubscriptionStatus.TRIAL,
        planCode,
        monthlyPriceCents,
        trialStartsAt,
        trialEndsAt,
        activatedAt: isSuperAdmin ? now : null,
        isExempt: isSuperAdmin,
      },
    });

    if (!isSuperAdmin && this.prisma.billingEvent?.create) {
      await this.prisma.billingEvent.create({
        data: {
          userId,
          action: BillingActionType.TRIAL_STARTED,
          daysGranted: this.catalogService.getTrialDays(),
          note: `Período de teste automático de ${this.catalogService.getTrialDays()} dias iniciado.`,
        },
      });
    }

    return created;
  }

  async getAccessStatus(userId: string, isSuperAdmin = false, now: Date = new Date()): Promise<SubscriptionAccessSummary> {
    const subscription = await this.ensureForUser(userId, isSuperAdmin);
    return evaluateSubscriptionAccess(subscription, now);
  }
}
