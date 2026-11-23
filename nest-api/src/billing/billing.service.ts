import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { BillingActionType, SetupRequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BillingCatalogService, formatPriceBRL } from './billing-catalog.service';
import { SubscriptionService, evaluateSubscriptionAccess } from './subscription.service';
import { CreateCheckoutIntentDto } from './dto/create-checkout-intent.dto';
import { CreateSetupRequestDto } from './dto/create-setup-request.dto';
import { BillingCheckoutIntentResult, ProductSetupRequestSummary } from './billing.types';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogService: BillingCatalogService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  private generateReferenceCode(prefix = 'HIVE'): string {
    const now = new Date();
    const dateStamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`;
    const token = randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}-${dateStamp}-${token}`;
  }

  private buildWhatsappMessage(params: {
    storeName: string;
    slug: string | null;
    email: string;
    referenceCode: string;
    includeMonthlyPlan: boolean;
    monthlyPlanPriceCents: number;
    batchLabel?: string;
    setupPriceCents?: number;
    totalPriceCents: number;
    contactPhone?: string | null;
    sourceDescription?: string | null;
  }): string {
    const lines: string[] = [
      `Olá! Gostaria de confirmar a solicitação no HiveERP:`,
      `• Loja: ${params.storeName}${params.slug ? ` (${params.slug})` : ''}`,
      `• E-mail da conta: ${params.email}`,
      `• Código de referência: ${params.referenceCode}`,
    ];

    if (params.includeMonthlyPlan) {
      lines.push(
        `• Plano: ${this.catalogService.getMonthlyPlanName()} (${formatPriceBRL(params.monthlyPlanPriceCents)})`,
      );
    }

    if (params.batchLabel && params.setupPriceCents !== undefined) {
      lines.push(
        `• Order Bump / Setup de Produtos: ${params.batchLabel} (${formatPriceBRL(params.setupPriceCents)})`,
      );
    }

    lines.push(`• Valor total Pix: ${formatPriceBRL(params.totalPriceCents)}`);

    if (params.contactPhone) {
      lines.push(`• WhatsApp de contato: ${params.contactPhone}`);
    }
    if (params.sourceDescription) {
      lines.push(`• Observações / Origem do catálogo: ${params.sourceDescription}`);
    }

    return lines.join('\n');
  }

  async getStatus(userId: string, isSuperAdmin = false) {
    const subRecord = await this.subscriptionService.ensureForUser(userId, isSuperAdmin);
    const subscription = evaluateSubscriptionAccess(subRecord);
    const catalog = this.catalogService.getCatalog();

    const [setupRequests, recentBillingEvents] = await Promise.all([
      this.prisma.productSetupRequest.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.billingEvent.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    return {
      subscription,
      catalog,
      setupRequests,
      recentBillingEvents,
    };
  }

  async createCheckoutIntent(
    userId: string,
    dto: CreateCheckoutIntentDto,
    isSuperAdmin = false,
  ): Promise<BillingCheckoutIntentResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { config: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    await this.subscriptionService.ensureForUser(userId, isSuperAdmin);

    const monthlyPlanPriceCents = this.catalogService.getMonthlyPriceCents();
    const batchOption = dto.setupBatchTier
      ? this.catalogService.getSetupBatchOption(dto.setupBatchTier)
      : null;

    const setupPriceCents = batchOption ? batchOption.priceCents : 0;
    const totalPriceCents = monthlyPlanPriceCents + setupPriceCents;
    const referenceCode = this.generateReferenceCode(batchOption ? 'HIVE-BUMP' : 'HIVE-PLAN');

    const contactPhone = dto.contactPhone?.trim() || null;
    const sourceDescription = dto.sourceDescription?.trim() || null;

    const whatsappMessage = this.buildWhatsappMessage({
      storeName: user.config?.storeName || user.name,
      slug: user.config?.publicSlug || null,
      email: user.email,
      referenceCode,
      includeMonthlyPlan: true,
      monthlyPlanPriceCents,
      batchLabel: batchOption?.label,
      setupPriceCents: batchOption?.priceCents,
      totalPriceCents,
      contactPhone,
      sourceDescription,
    });

    const whatsappUrl = this.catalogService.buildWhatsappUrl(whatsappMessage);

    const setupRequestId = await this.prisma.$transaction(async (tx) => {
      let createdSetupId: string | null = null;

      if (batchOption) {
        const setupReq = await tx.productSetupRequest.create({
          data: {
            userId,
            batchTier: batchOption.tier,
            maxProducts: batchOption.maxProducts,
            priceCents: batchOption.priceCents,
            includeMonthlyPlan: true,
            monthlyPlanPriceCents,
            totalPriceCents,
            status: SetupRequestStatus.PENDING,
            referenceCode,
            contactPhone,
            sourceDescription,
            whatsappMessage,
          },
        });
        createdSetupId = setupReq.id;
      }

      await tx.billingEvent.create({
        data: {
          userId,
          actorUserId: userId,
          action: BillingActionType.CHECKOUT_INTENT_CREATED,
          amountCents: totalPriceCents,
          referenceCode,
          note: batchOption
            ? `Intenção Pix: Plano mensal + ${batchOption.label}`
            : 'Intenção Pix: Plano mensal HiveERP',
          metadata: {
            includeMonthlyPlan: true,
            setupBatchTier: batchOption?.tier ?? null,
            setupMaxProducts: batchOption?.maxProducts ?? null,
          },
        },
      });

      return createdSetupId;
    });

    return {
      referenceCode,
      monthlyPlanPriceCents,
      setupBatchTier: batchOption?.tier ?? null,
      setupBatchMaxProducts: batchOption?.maxProducts ?? null,
      setupPriceCents,
      totalPriceCents,
      pix: this.catalogService.getPixConfig(),
      supportWhatsapp: this.catalogService.getSupportWhatsapp(),
      whatsappMessage,
      whatsappUrl,
      setupRequestId,
    };
  }

  async createSetupRequest(
    userId: string,
    dto: CreateSetupRequestDto,
    isSuperAdmin = false,
  ): Promise<ProductSetupRequestSummary & { pix: ReturnType<BillingCatalogService['getPixConfig']>; whatsappUrl: string | null }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { config: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    await this.subscriptionService.ensureForUser(userId, isSuperAdmin);

    const batchOption = this.catalogService.getSetupBatchOption(dto.batchTier);
    const includeMonthlyPlan = Boolean(dto.includeMonthlyPlan);
    const monthlyPlanPriceCents = includeMonthlyPlan ? this.catalogService.getMonthlyPriceCents() : 0;
    const totalPriceCents = batchOption.priceCents + monthlyPlanPriceCents;
    const referenceCode = this.generateReferenceCode('HIVE-SETUP');

    const contactPhone = dto.contactPhone?.trim() || null;
    const sourceDescription = dto.sourceDescription?.trim() || null;

    const whatsappMessage = this.buildWhatsappMessage({
      storeName: user.config?.storeName || user.name,
      slug: user.config?.publicSlug || null,
      email: user.email,
      referenceCode,
      includeMonthlyPlan,
      monthlyPlanPriceCents,
      batchLabel: batchOption.label,
      setupPriceCents: batchOption.priceCents,
      totalPriceCents,
      contactPhone,
      sourceDescription,
    });

    const created = await this.prisma.$transaction(async (tx) => {
      const setupRequest = await tx.productSetupRequest.create({
        data: {
          userId,
          batchTier: batchOption.tier,
          maxProducts: batchOption.maxProducts,
          priceCents: batchOption.priceCents,
          includeMonthlyPlan,
          monthlyPlanPriceCents,
          totalPriceCents,
          status: SetupRequestStatus.PENDING,
          referenceCode,
          contactPhone,
          sourceDescription,
          whatsappMessage,
        },
      });

      await tx.billingEvent.create({
        data: {
          userId,
          actorUserId: userId,
          action: BillingActionType.SETUP_REQUEST_CREATED,
          amountCents: totalPriceCents,
          referenceCode,
          note: `${batchOption.label}${includeMonthlyPlan ? ' + Plano Mensal' : ''}`,
          metadata: {
            batchTier: batchOption.tier,
            maxProducts: batchOption.maxProducts,
            includeMonthlyPlan,
          },
        },
      });

      return setupRequest;
    });

    return {
      ...created,
      pix: this.catalogService.getPixConfig(),
      whatsappUrl: this.catalogService.buildWhatsappUrl(whatsappMessage),
    };
  }

  async listSetupRequests(userId: string) {
    return this.prisma.productSetupRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelSetupRequest(id: string, userId: string) {
    const existing = await this.prisma.productSetupRequest.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Solicitação de setup não encontrada');
    }

    if (existing.status !== SetupRequestStatus.PENDING) {
      throw new BadRequestException('Apenas solicitações pendentes podem ser canceladas');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.productSetupRequest.update({
        where: { id: existing.id },
        data: {
          status: SetupRequestStatus.CANCELED,
          canceledAt: new Date(),
        },
      });

      await tx.billingEvent.create({
        data: {
          userId,
          actorUserId: userId,
          action: BillingActionType.SETUP_REQUEST_STATUS_CHANGED,
          referenceCode: existing.referenceCode,
          note: 'Solicitação de setup cancelada pelo lojista.',
          metadata: {
            setupRequestId: existing.id,
            fromStatus: existing.status,
            toStatus: SetupRequestStatus.CANCELED,
          },
        },
      });

      return updated;
    });
  }
}
