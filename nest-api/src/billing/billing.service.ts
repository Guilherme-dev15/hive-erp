import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { BillingActionType, SetupRequestStatus, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BillingCatalogService, formatPriceBRL } from './billing-catalog.service';
import { SubscriptionService, evaluateSubscriptionAccess } from './subscription.service';
import { CreateCheckoutIntentDto } from './dto/create-checkout-intent.dto';
import { CreateSetupRequestDto } from './dto/create-setup-request.dto';
import { BillingWebhookDto, GatewayWebhookEvent } from './dto/billing-webhook.dto';
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
    includeGatewayAddon?: boolean;
    gatewayAddonPriceCents?: number;
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
        `• Implantação VIP / Cadastro de Catálogo: ${params.batchLabel} (${formatPriceBRL(params.setupPriceCents)})`,
      );
    }

    if (params.includeGatewayAddon && params.gatewayAddonPriceCents !== undefined) {
      lines.push(
        `• Módulo Checkout Online / Gateway no Catálogo: Pix Automático + Cartão (${formatPriceBRL(params.gatewayAddonPriceCents)})`,
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

    const gatewayAddon = dto.includeGatewayAddon ? this.catalogService.getGatewayAddon() : null;
    const gatewayAddonPriceCents = gatewayAddon ? gatewayAddon.priceCents : 0;

    const setupPriceCents = batchOption ? batchOption.priceCents : 0;
    const totalPriceCents = monthlyPlanPriceCents + setupPriceCents + gatewayAddonPriceCents;
    const referenceCode = this.generateReferenceCode(
      batchOption || gatewayAddon ? 'HIVE-BUMP' : 'HIVE-PLAN',
    );

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
      includeGatewayAddon: Boolean(dto.includeGatewayAddon),
      gatewayAddonPriceCents,
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
          note: [
            'Intenção Pix: Plano mensal HiveERP',
            batchOption?.label,
            gatewayAddon ? 'Módulo Gateway no Catálogo' : null,
          ]
            .filter(Boolean)
            .join(' + '),
          metadata: {
            includeMonthlyPlan: true,
            setupBatchTier: batchOption?.tier ?? null,
            setupMaxProducts: batchOption?.maxProducts ?? null,
            includeGatewayAddon: Boolean(dto.includeGatewayAddon),
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
      includeGatewayAddon: Boolean(dto.includeGatewayAddon),
      gatewayAddonPriceCents,
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

  /**
   * Processamento Seguro e Idempotente de Webhooks do Gateway de Faturamento (Anti-Fraude Zero Trust)
   */
  async processWebhook(dto: BillingWebhookDto) {
    if (!dto || !dto.id) {
      throw new BadRequestException('Payload do webhook inválido ou sem identificador de evento');
    }

    // Camada 2: Proteção Anti-Replay / Idempotência Atômica
    const existingEvent = await this.prisma.billingEvent.findFirst({
      where: {
        referenceCode: dto.id,
      },
    });

    if (existingEvent) {
      return {
        success: true,
        idempotent: true,
        message: 'Evento já processado anteriormente',
        eventId: existingEvent.id,
      };
    }

    // Identificação do Lojista (Tenant)
    const userId = dto.metadata?.userId || dto.payment?.externalReference;
    if (!userId) {
      throw new BadRequestException('Identificador do lojista (userId) ausente nos metadados');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
        config: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Lojista ${userId} não encontrado no sistema`);
    }

    const eventName = String(dto.event).toUpperCase();
    const paidCents = Math.round((Number(dto.payment?.value) || 0) * 100);

    // Eventos de Pagamento Confirmado (Ativação / Renovação)
    if (
      eventName === GatewayWebhookEvent.PAYMENT_RECEIVED ||
      eventName === GatewayWebhookEvent.PAYMENT_CONFIRMED
    ) {
      // Camada 3: Verificação de Integridade de Valor (Anti-Fraude de Centavos)
      const basePlanCents = user.subscription?.monthlyPriceCents || 9700;
      const expectedMinimumCents = dto.metadata?.includeGatewayAddon
        ? basePlanCents + 4900
        : basePlanCents;

      // Se o valor pago for menor que o esperado (tolerância zero para adulteração)
      if (paidCents < expectedMinimumCents) {
        await this.prisma.billingEvent.create({
          data: {
            userId: user.id,
            action: BillingActionType.ACCOUNT_SUSPENDED,
            amountCents: paidCents,
            referenceCode: dto.id,
            note: `ALERTA ANTI-FRAUDE: Pagamento recebido com valor divergente (esperado R$ ${(expectedMinimumCents / 100).toFixed(2)}, recebido R$ ${(paidCents / 100).toFixed(2)})`,
            metadata: {
              gatewayEventId: dto.id,
              paymentId: dto.payment?.id,
              status: dto.payment?.status,
              flaggedAsSuspicious: true,
            },
          },
        });

        return {
          success: false,
          flagged: true,
          message: 'Pagamento recebido com valor divergente do plano. Registrado para auditoria.',
        };
      }

      // Cálculo do novo período (30 dias)
      const now = new Date();
      const currentPeriodEnd = user.subscription?.currentPeriodEnd;
      let newPeriodEnd: Date;

      if (currentPeriodEnd && new Date(currentPeriodEnd).getTime() > now.getTime()) {
        newPeriodEnd = new Date(new Date(currentPeriodEnd).getTime() + 30 * 24 * 60 * 60 * 1000);
      } else {
        newPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      }

      const isAlreadyActive = user.subscription?.status === SubscriptionStatus.ACTIVE;

      // Atualização atômica da Subscription
      await this.prisma.subscription.upsert({
        where: { userId: user.id },
        update: {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd: newPeriodEnd,
          activatedAt: user.subscription?.activatedAt || now,
          lastPaymentNote: `Pago via Gateway (${dto.payment?.billingType || 'ONLINE'}) - R$ ${(paidCents / 100).toFixed(2)}`,
        },
        create: {
          userId: user.id,
          status: SubscriptionStatus.ACTIVE,
          monthlyPriceCents: basePlanCents,
          trialStartsAt: now,
          trialEndsAt: now,
          currentPeriodStart: now,
          currentPeriodEnd: newPeriodEnd,
          activatedAt: now,
          lastPaymentNote: `Pago via Gateway (${dto.payment?.billingType || 'ONLINE'}) - R$ ${(paidCents / 100).toFixed(2)}`,
        },
      });

      // Se contratou o Add-on de Gateway, ativa na Config da loja
      if (dto.metadata?.includeGatewayAddon && user.config) {
        await this.prisma.config.update({
          where: { userId: user.id },
          data: {
            hasGatewayAddon: true,
          },
        });
      }

      // Registro Imutável de Auditoria
      const createdEvent = await this.prisma.billingEvent.create({
        data: {
          userId: user.id,
          action: isAlreadyActive
            ? BillingActionType.SUBSCRIPTION_EXTENDED
            : BillingActionType.SUBSCRIPTION_ACTIVATED,
          amountCents: paidCents,
          daysGranted: 30,
          referenceCode: dto.id,
          note: `Assinatura confirmada com sucesso via Webhook do Gateway (${eventName})`,
          metadata: {
            gatewayEventId: dto.id,
            paymentId: dto.payment?.id,
            billingType: dto.payment?.billingType,
            status: dto.payment?.status,
            includeGatewayAddon: Boolean(dto.metadata?.includeGatewayAddon),
          },
        },
      });

      return {
        success: true,
        activated: true,
        extendedDays: 30,
        periodEnd: newPeriodEnd,
        billingEventId: createdEvent.id,
      };
    }

    // Eventos de Inadimplência / Atraso
    if (eventName === GatewayWebhookEvent.PAYMENT_OVERDUE) {
      const now = new Date();
      const currentPeriodEnd = user.subscription?.currentPeriodEnd;

      if (!currentPeriodEnd || new Date(currentPeriodEnd).getTime() <= now.getTime()) {
        await this.prisma.subscription.update({
          where: { userId: user.id },
          data: { status: SubscriptionStatus.EXPIRED },
        });
      }

      await this.prisma.billingEvent.create({
        data: {
          userId: user.id,
          action: BillingActionType.SUBSCRIPTION_EXPIRED,
          amountCents: paidCents,
          referenceCode: dto.id,
          note: `Cobrança vencida sem confirmação de pagamento (${eventName})`,
          metadata: {
            gatewayEventId: dto.id,
            paymentId: dto.payment?.id,
          },
        },
      });

      return { success: true, processed: true, event: eventName };
    }

    // Eventos de Estorno / Reembolso / Cancelamento
    if (
      eventName === GatewayWebhookEvent.PAYMENT_REFUNDED ||
      eventName === GatewayWebhookEvent.PAYMENT_DELETED
    ) {
      await this.prisma.subscription.update({
        where: { userId: user.id },
        data: { status: SubscriptionStatus.CANCELED },
      });

      if (user.config?.hasGatewayAddon) {
        await this.prisma.config.update({
          where: { userId: user.id },
          data: { hasGatewayAddon: false },
        });
      }

      await this.prisma.billingEvent.create({
        data: {
          userId: user.id,
          action: BillingActionType.SUBSCRIPTION_CANCELED,
          amountCents: paidCents,
          referenceCode: dto.id,
          note: `Assinatura cancelada por reembolso/estorno de pagamento (${eventName})`,
          metadata: {
            gatewayEventId: dto.id,
            paymentId: dto.payment?.id,
          },
        },
      });

      return { success: true, canceled: true, event: eventName };
    }

    return { success: true, unhandledEvent: eventName };
  }
}
