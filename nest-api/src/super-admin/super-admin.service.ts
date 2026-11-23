import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  BillingActionType,
  Role,
  SetupRequestStatus,
  SubscriptionStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BillingCatalogService } from '../billing/billing-catalog.service';
import { SubscriptionService, evaluateSubscriptionAccess } from '../billing/subscription.service';
import { ProductsService } from '../products/products.service';
import { getAdminEmails } from '../auth/auth.guard';
import {
  SuperAdminSubscriptionAction,
  UpdateTenantSubscriptionDto,
} from './dto/update-tenant-subscription.dto';
import { UpdateSetupRequestDto } from './dto/update-setup-request.dto';
import { SuperAdminImportProductsDto } from './dto/super-admin-import-products.dto';

const MS_PER_DAY = 86_400_000;

@Injectable()
export class SuperAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogService: BillingCatalogService,
    private readonly subscriptionService: SubscriptionService,
    private readonly productsService: ProductsService,
  ) {}

  private buildFallbackSubscription(createdAt: Date) {
    const trialDays = this.catalogService.getTrialDays();
    return {
      status: SubscriptionStatus.TRIAL,
      planCode: this.catalogService.getMonthlyPlanCode(),
      monthlyPriceCents: this.catalogService.getMonthlyPriceCents(),
      trialStartsAt: createdAt,
      trialEndsAt: new Date(createdAt.getTime() + trialDays * MS_PER_DAY),
      currentPeriodStart: null,
      currentPeriodEnd: null,
      isExempt: false,
    };
  }

  async getOverview() {
    const now = new Date();
    const [owners, setupCounts] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: Role.OWNER },
        select: {
          id: true,
          active: true,
          createdAt: true,
          subscription: true,
        },
      }),
      this.prisma.productSetupRequest.findMany({
        select: {
          status: true,
          priceCents: true,
        },
      }),
    ]);

    let trialTenants = 0;
    let activePaidTenants = 0;
    let exemptTenants = 0;
    let expiredOrCanceledTenants = 0;
    let suspendedTenants = 0;
    let estimatedMrrCents = 0;

    for (const owner of owners) {
      if (!owner.active) {
        suspendedTenants++;
      }

      const subAccess = evaluateSubscriptionAccess(
        owner.subscription ?? this.buildFallbackSubscription(owner.createdAt),
        now,
      );

      if (subAccess.isExempt) {
        exemptTenants++;
      } else if (subAccess.effectiveStatus === SubscriptionStatus.TRIAL) {
        trialTenants++;
      } else if (subAccess.effectiveStatus === SubscriptionStatus.ACTIVE) {
        activePaidTenants++;
        estimatedMrrCents += subAccess.monthlyPriceCents;
      } else {
        expiredOrCanceledTenants++;
      }
    }

    let pendingSetupRequests = 0;
    let inProgressSetupRequests = 0;
    let completedSetupRequests = 0;
    let setupRevenueCents = 0;

    for (const req of setupCounts) {
      if (req.status === SetupRequestStatus.PENDING) pendingSetupRequests++;
      if (req.status === SetupRequestStatus.IN_PROGRESS) inProgressSetupRequests++;
      if (req.status === SetupRequestStatus.COMPLETED) completedSetupRequests++;
      if (
        req.status === SetupRequestStatus.PAID ||
        req.status === SetupRequestStatus.IN_PROGRESS ||
        req.status === SetupRequestStatus.COMPLETED
      ) {
        setupRevenueCents += req.priceCents;
      }
    }

    return {
      totalTenants: owners.length,
      trialTenants,
      activePaidTenants,
      exemptTenants,
      expiredOrCanceledTenants,
      suspendedTenants,
      pendingSetupRequests,
      inProgressSetupRequests,
      completedSetupRequests,
      estimatedMrrCents,
      setupRevenueCents,
    };
  }

  async listTenants(query?: { search?: string; status?: string }) {
    const now = new Date();
    const owners = await this.prisma.user.findMany({
      where: { role: Role.OWNER },
      include: {
        config: true,
        subscription: true,
        _count: {
          select: {
            products: true,
            orders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const pendingRequests = await this.prisma.productSetupRequest.findMany({
      where: {
        status: {
          in: [SetupRequestStatus.PENDING, SetupRequestStatus.PAID, SetupRequestStatus.IN_PROGRESS],
        },
      },
      select: {
        userId: true,
        status: true,
      },
    });

    const pendingByUser = new Map<string, number>();
    for (const req of pendingRequests) {
      pendingByUser.set(req.userId, (pendingByUser.get(req.userId) ?? 0) + 1);
    }

    const search = query?.search?.trim().toLowerCase();
    const statusFilter = query?.status?.trim().toUpperCase();

    return owners
      .map((owner) => {
        const subscription = evaluateSubscriptionAccess(
          owner.subscription ?? this.buildFallbackSubscription(owner.createdAt),
          now,
        );

        return {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          active: owner.active,
          createdAt: owner.createdAt,
          storeName: owner.config?.storeName ?? owner.name,
          slug: owner.config?.publicSlug ?? null,
          whatsappNumber: owner.config?.whatsappNumber ?? null,
          productsCount: owner._count?.products ?? 0,
          ordersCount: owner._count?.orders ?? 0,
          openSetupRequestsCount: pendingByUser.get(owner.id) ?? 0,
          subscription,
        };
      })
      .filter((item) => {
        if (search) {
          const haystack = `${item.name} ${item.email} ${item.storeName} ${item.slug ?? ''}`.toLowerCase();
          if (!haystack.includes(search)) return false;
        }

        if (statusFilter && statusFilter !== 'ALL') {
          if (statusFilter === 'SUSPENDED') return !item.active;
          if (statusFilter === 'EXEMPT') return item.subscription.isExempt;
          return item.subscription.effectiveStatus === statusFilter;
        }

        return true;
      });
  }

  async updateTenantSubscription(
    targetUserId: string,
    dto: UpdateTenantSubscriptionDto,
    adminUserId: string,
  ) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { subscription: true, config: true },
    });

    if (!targetUser) {
      throw new NotFoundException('Lojista não encontrado');
    }

    const adminEmails = getAdminEmails();
    const targetIsPlatformAdmin = adminEmails.includes(targetUser.email.trim().toLowerCase());

    if (
      dto.action === SuperAdminSubscriptionAction.SUSPEND_ACCOUNT &&
      (targetUser.id === adminUserId || targetIsPlatformAdmin)
    ) {
      throw new BadRequestException('Não é permitido suspender uma conta administradora da plataforma');
    }

    if (
      (dto.action === SuperAdminSubscriptionAction.EXPIRE_NOW ||
        dto.action === SuperAdminSubscriptionAction.CANCEL) &&
      targetIsPlatformAdmin
    ) {
      throw new BadRequestException('Não é permitido bloquear a conta administradora da plataforma');
    }

    await this.subscriptionService.ensureForUser(targetUser.id, targetIsPlatformAdmin);
    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const currentSub = await tx.subscription.findUnique({
        where: { userId: targetUser.id },
      });

      if (!currentSub) {
        throw new NotFoundException('Assinatura do lojista não encontrada');
      }

      let actionType: BillingActionType = BillingActionType.SUBSCRIPTION_ACTIVATED;
      let daysGranted: number | null = null;
      let nextStatus = currentSub.status;
      let nextIsExempt = currentSub.isExempt;
      let nextTrialEndsAt = currentSub.trialEndsAt;
      let nextPeriodStart = currentSub.currentPeriodStart;
      let nextPeriodEnd = currentSub.currentPeriodEnd;
      let nextActivatedAt = currentSub.activatedAt;
      let nextCanceledAt = currentSub.canceledAt;
      let userActive = targetUser.active;

      switch (dto.action) {
        case SuperAdminSubscriptionAction.ACTIVATE_MONTHLY:
        case SuperAdminSubscriptionAction.GRANT_DAYS: {
          const days = dto.days ?? 30;
          const baseDate =
            currentSub.currentPeriodEnd && currentSub.currentPeriodEnd.getTime() > now.getTime()
              ? currentSub.currentPeriodEnd
              : now;
          nextStatus = SubscriptionStatus.ACTIVE;
          nextPeriodStart = currentSub.currentPeriodStart ?? now;
          nextPeriodEnd = new Date(baseDate.getTime() + days * MS_PER_DAY);
          nextActivatedAt = currentSub.activatedAt ?? now;
          nextCanceledAt = null;
          daysGranted = days;
          actionType =
            currentSub.status === SubscriptionStatus.ACTIVE
              ? BillingActionType.SUBSCRIPTION_EXTENDED
              : BillingActionType.SUBSCRIPTION_ACTIVATED;
          break;
        }
        case SuperAdminSubscriptionAction.EXTEND_TRIAL: {
          const days = dto.days ?? 7;
          const baseDate =
            currentSub.trialEndsAt.getTime() > now.getTime() ? currentSub.trialEndsAt : now;
          nextStatus = SubscriptionStatus.TRIAL;
          nextTrialEndsAt = new Date(baseDate.getTime() + days * MS_PER_DAY);
          nextCanceledAt = null;
          daysGranted = days;
          actionType = BillingActionType.SUBSCRIPTION_EXTENDED;
          break;
        }
        case SuperAdminSubscriptionAction.SET_EXEMPT: {
          nextIsExempt = dto.isExempt ?? true;
          if (nextIsExempt) {
            nextStatus = SubscriptionStatus.ACTIVE;
            nextActivatedAt = currentSub.activatedAt ?? now;
            nextCanceledAt = null;
          }
          actionType = BillingActionType.SUBSCRIPTION_ACTIVATED;
          break;
        }
        case SuperAdminSubscriptionAction.EXPIRE_NOW: {
          nextStatus = SubscriptionStatus.EXPIRED;
          nextIsExempt = false;
          nextTrialEndsAt =
            currentSub.trialEndsAt.getTime() > now.getTime() ? now : currentSub.trialEndsAt;
          nextPeriodEnd =
            currentSub.currentPeriodEnd && currentSub.currentPeriodEnd.getTime() > now.getTime()
              ? now
              : currentSub.currentPeriodEnd;
          actionType = BillingActionType.SUBSCRIPTION_EXPIRED;
          break;
        }
        case SuperAdminSubscriptionAction.CANCEL: {
          nextStatus = SubscriptionStatus.CANCELED;
          nextIsExempt = false;
          nextCanceledAt = now;
          actionType = BillingActionType.SUBSCRIPTION_CANCELED;
          break;
        }
        case SuperAdminSubscriptionAction.SUSPEND_ACCOUNT: {
          userActive = false;
          await tx.user.update({
            where: { id: targetUser.id },
            data: { active: false },
          });
          actionType = BillingActionType.ACCOUNT_SUSPENDED;
          break;
        }
        case SuperAdminSubscriptionAction.REACTIVATE_ACCOUNT: {
          userActive = true;
          await tx.user.update({
            where: { id: targetUser.id },
            data: { active: true },
          });
          actionType = BillingActionType.ACCOUNT_REACTIVATED;
          break;
        }
      }

      const savedSub = await tx.subscription.update({
        where: { userId: targetUser.id },
        data: {
          status: nextStatus,
          isExempt: nextIsExempt,
          trialEndsAt: nextTrialEndsAt,
          currentPeriodStart: nextPeriodStart,
          currentPeriodEnd: nextPeriodEnd,
          activatedAt: nextActivatedAt,
          canceledAt: nextCanceledAt,
          lastPaymentNote: dto.note?.trim() || currentSub.lastPaymentNote,
          updatedByAdminId: adminUserId,
        },
      });

      await tx.billingEvent.create({
        data: {
          userId: targetUser.id,
          actorUserId: adminUserId,
          action: actionType,
          amountCents: dto.amountCents ?? null,
          daysGranted,
          note: dto.note?.trim() || `Ação Super-Admin: ${dto.action}`,
          metadata: {
            superAdminAction: dto.action,
          },
        },
      });

      return {
        userId: targetUser.id,
        active: userActive,
        subscription: evaluateSubscriptionAccess(savedSub, now),
      };
    });

    return updated;
  }

  async listSetupRequests(query?: { status?: string; search?: string }) {
    const statusFilter = query?.status?.trim().toUpperCase();
    const search = query?.search?.trim().toLowerCase();

    const rows = await this.prisma.productSetupRequest.findMany({
      where:
        statusFilter && statusFilter !== 'ALL' && statusFilter in SetupRequestStatus
          ? { status: statusFilter as SetupRequestStatus }
          : undefined,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            config: {
              select: {
                storeName: true,
                publicSlug: true,
                whatsappNumber: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows
      .map((row) => ({
        ...row,
        storeName: row.user.config?.storeName ?? row.user.name,
        slug: row.user.config?.publicSlug ?? null,
        ownerName: row.user.name,
        ownerEmail: row.user.email,
        storeWhatsapp: row.user.config?.whatsappNumber ?? null,
      }))
      .filter((row) => {
        if (!search) return true;
        const haystack = `${row.referenceCode} ${row.storeName} ${row.ownerEmail} ${row.slug ?? ''}`.toLowerCase();
        return haystack.includes(search);
      });
  }

  async updateSetupRequest(requestId: string, dto: UpdateSetupRequestDto, adminUserId: string) {
    const existing = await this.prisma.productSetupRequest.findUnique({
      where: { id: requestId },
    });

    if (!existing) {
      throw new NotFoundException('Solicitação de setup não encontrada');
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.productSetupRequest.update({
        where: { id: existing.id },
        data: {
          status: dto.status,
          adminNotes: dto.adminNotes !== undefined ? dto.adminNotes.trim() : existing.adminNotes,
          importedCount: dto.importedCount !== undefined ? dto.importedCount : existing.importedCount,
          paidAt:
            dto.status === SetupRequestStatus.PAID
              ? existing.paidAt ?? now
              : existing.paidAt,
          startedAt:
            dto.status === SetupRequestStatus.IN_PROGRESS
              ? existing.startedAt ?? now
              : existing.startedAt,
          completedAt:
            dto.status === SetupRequestStatus.COMPLETED
              ? existing.completedAt ?? now
              : existing.completedAt,
          canceledAt:
            dto.status === SetupRequestStatus.CANCELED
              ? existing.canceledAt ?? now
              : existing.canceledAt,
          updatedByAdminId: adminUserId,
        },
      });

      await tx.billingEvent.create({
        data: {
          userId: existing.userId,
          actorUserId: adminUserId,
          action: BillingActionType.SETUP_REQUEST_STATUS_CHANGED,
          amountCents: existing.priceCents,
          referenceCode: existing.referenceCode,
          note:
            dto.adminNotes?.trim() ||
            `Setup ${existing.referenceCode} alterado de ${existing.status} para ${dto.status}`,
          metadata: {
            setupRequestId: existing.id,
            fromStatus: existing.status,
            toStatus: dto.status,
            importedCount: dto.importedCount ?? null,
          },
        },
      });

      const shouldActivatePlan =
        Boolean(dto.activateMonthlyPlanToo) &&
        existing.includeMonthlyPlan &&
        (dto.status === SetupRequestStatus.PAID ||
          dto.status === SetupRequestStatus.IN_PROGRESS ||
          dto.status === SetupRequestStatus.COMPLETED);

      let activatedSubscription: ReturnType<typeof evaluateSubscriptionAccess> | null = null;

      if (shouldActivatePlan) {
        const days = dto.monthlyDays ?? 30;
        const currentSub = await tx.subscription.findUnique({
          where: { userId: existing.userId },
        });
        const baseDate =
          currentSub?.currentPeriodEnd && currentSub.currentPeriodEnd.getTime() > now.getTime()
            ? currentSub.currentPeriodEnd
            : now;
        const nextPeriodEnd = new Date(baseDate.getTime() + days * MS_PER_DAY);

        const savedSub = await tx.subscription.upsert({
          where: { userId: existing.userId },
          update: {
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: currentSub?.currentPeriodStart ?? now,
            currentPeriodEnd: nextPeriodEnd,
            activatedAt: currentSub?.activatedAt ?? now,
            canceledAt: null,
            lastPaymentNote: `Ativado via pedido combinado ${existing.referenceCode}`,
            updatedByAdminId: adminUserId,
          },
          create: {
            userId: existing.userId,
            status: SubscriptionStatus.ACTIVE,
            planCode: this.catalogService.getMonthlyPlanCode(),
            monthlyPriceCents: this.catalogService.getMonthlyPriceCents(),
            trialStartsAt: now,
            trialEndsAt: now,
            currentPeriodStart: now,
            currentPeriodEnd: nextPeriodEnd,
            activatedAt: now,
            lastPaymentNote: `Ativado via pedido combinado ${existing.referenceCode}`,
            updatedByAdminId: adminUserId,
          },
        });

        await tx.billingEvent.create({
          data: {
            userId: existing.userId,
            actorUserId: adminUserId,
            action: BillingActionType.SUBSCRIPTION_ACTIVATED,
            amountCents: existing.monthlyPlanPriceCents,
            daysGranted: days,
            referenceCode: existing.referenceCode,
            note: `Assinatura mensal (${days} dias) ativada junto do Order Bump ${existing.referenceCode}`,
          },
        });

        activatedSubscription = evaluateSubscriptionAccess(savedSub, now);
      }

      return {
        setupRequest: updated,
        activatedSubscription,
      };
    });
  }

  async importProductsForTenant(
    targetUserId: string,
    dto: SuperAdminImportProductsDto,
    adminUserId: string,
  ) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Lojista não encontrado');
    }

    if (dto.setupRequestId) {
      const setupReq = await this.prisma.productSetupRequest.findFirst({
        where: { id: dto.setupRequestId, userId: targetUserId },
      });
      if (!setupReq) {
        throw new NotFoundException('Solicitação de setup não encontrada para este lojista');
      }
    }

    const result = await this.productsService.importBulk(dto.products, targetUserId);

    if (dto.setupRequestId) {
      await this.prisma.productSetupRequest.update({
        where: { id: dto.setupRequestId },
        data: {
          importedCount: result.count,
          updatedByAdminId: adminUserId,
        },
      });
    }

    return result;
  }
}
