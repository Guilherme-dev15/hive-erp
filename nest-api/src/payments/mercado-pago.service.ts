import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { OrderStatus, PaymentMethod, Prisma } from '@prisma/client';
import { createHmac } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { decryptSecret } from '../common/crypto.util';
import { timingSafeCompare } from '../billing/billing-webhook.guard';

export interface CreateMercadoPagoPreferenceParams {
  orderId: string;
  storeName: string;
  slug: string;
  customerName: string;
  encryptedAccessToken: string;
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unitPrice: number;
  }>;
  returnBaseUrl?: string;
}

export interface MercadoPagoPaymentRecord {
  id: string | number;
  status: string;
  external_reference?: string | null;
  transaction_amount?: number;
  payment_method_id?: string | null;
}

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);

  constructor(private readonly prisma: PrismaService) {}

  resolveCatalogReturnBaseUrl(slug: string, candidate?: string): string {
    const fallback = `https://${slug}.hiveerp.com.br`;
    if (!candidate) return fallback;

    try {
      const parsed = new URL(candidate);
      const host = parsed.hostname.toLowerCase();
      const isLocalhost = host === 'localhost' || host.endsWith('.localhost');
      const isAllowedProd =
        parsed.protocol === 'https:' &&
        (host === 'hiveerp.com.br' ||
          host.endsWith('.hiveerp.com.br') ||
          host.endsWith('.vercel.app'));

      if (isAllowedProd || (isLocalhost && (parsed.protocol === 'http:' || parsed.protocol === 'https:'))) {
        return parsed.origin;
      }
    } catch {
      return fallback;
    }

    return fallback;
  }

  async createCheckoutPreference(
    params: CreateMercadoPagoPreferenceParams,
  ): Promise<{ preferenceId: string; paymentUrl: string }> {
    const accessToken = decryptSecret(params.encryptedAccessToken);
    const apiPublicUrl = (process.env.API_PUBLIC_URL || 'https://app.hiveerp.com.br').replace(/\/$/, '');
    const notificationUrl = `${apiPublicUrl}/api/v2/payments/mercadopago/webhook/${encodeURIComponent(params.slug)}`;
    const catalogBaseUrl = this.resolveCatalogReturnBaseUrl(params.slug, params.returnBaseUrl);

    const payload = {
      items: params.items.map((item) => ({
        id: item.id,
        title: item.title.slice(0, 250),
        quantity: item.quantity,
        currency_id: 'BRL',
        unit_price: Number(Number(item.unitPrice).toFixed(2)),
      })),
      external_reference: params.orderId,
      payer: {
        name: params.customerName,
      },
      notification_url: notificationUrl,
      back_urls: {
        success: `${catalogBaseUrl}/?pagamento=aprovado&pedido=${encodeURIComponent(params.orderId)}`,
        pending: `${catalogBaseUrl}/?pagamento=pendente&pedido=${encodeURIComponent(params.orderId)}`,
        failure: `${catalogBaseUrl}/?pagamento=falhou&pedido=${encodeURIComponent(params.orderId)}`,
      },
      auto_return: 'approved',
      statement_descriptor: (params.storeName || 'HIVE STORE').slice(0, 22),
    };

    let response: Response;
    try {
      response = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000),
      });
    } catch (err) {
      this.logger.error('Erro de rede ao criar preferência no Mercado Pago:', err);
      throw new BadRequestException(
        'Não foi possível iniciar o pagamento no Mercado Pago. Verifique as credenciais da loja.',
      );
    }

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    const paymentUrl = data?.init_point || data?.sandbox_init_point;
    if (!response.ok || !data?.id || !paymentUrl) {
      this.logger.warn(
        `Mercado Pago retornou erro ao criar preferência (HTTP ${response.status}): ${JSON.stringify(data)}`,
      );
      throw new BadRequestException(
        'Não foi possível iniciar o pagamento no Mercado Pago. Verifique as credenciais da loja.',
      );
    }

    return {
      preferenceId: String(data.id),
      paymentUrl: String(paymentUrl),
    };
  }

  verifyWebhookSignature(
    headers: Record<string, string | string[] | undefined>,
    dataId: string,
    encryptedWebhookSecret: string,
  ): boolean {
    const rawHeader = headers['x-signature'];
    const signatureHeader = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
    if (!signatureHeader) return false;

    const parts = signatureHeader.split(',').reduce<Record<string, string>>((acc, chunk) => {
      const [k, ...rest] = chunk.split('=');
      if (k && rest.length > 0) {
        acc[k.trim()] = rest.join('=').trim();
      }
      return acc;
    }, {});

    const ts = parts.ts;
    const v1 = parts.v1;
    if (!ts || !v1) return false;

    const rawReqId = headers['x-request-id'];
    const requestId = Array.isArray(rawReqId) ? rawReqId[0] : rawReqId || '';

    const secret = decryptSecret(encryptedWebhookSecret);
    const normalizedId = String(dataId).toLowerCase();
    const candidates = Array.from(
      new Set([
        `id:${normalizedId};request-id:${requestId};ts:${ts};`,
        `id:${dataId};request-id:${requestId};ts:${ts};`,
      ]),
    );

    return candidates.some((manifest) => {
      const expected = createHmac('sha256', secret).update(manifest).digest('hex');
      return timingSafeCompare(v1, expected);
    });
  }

  async fetchPaymentById(
    paymentId: string,
    encryptedAccessToken: string,
  ): Promise<MercadoPagoPaymentRecord> {
    const accessToken = decryptSecret(encryptedAccessToken);
    let response: Response;
    try {
      response = await fetch(
        `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          signal: AbortSignal.timeout(15_000),
        },
      );
    } catch (err) {
      this.logger.error(`Erro ao consultar pagamento ${paymentId} no Mercado Pago:`, err);
      throw new BadRequestException('Falha ao consultar pagamento no Mercado Pago.');
    }

    if (!response.ok) {
      throw new BadRequestException('Falha ao consultar pagamento no Mercado Pago.');
    }

    return (await response.json()) as MercadoPagoPaymentRecord;
  }

  async processMerchantWebhook(
    slug: string,
    body: any,
    query: Record<string, string | undefined>,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<{ duplicate?: boolean; ignored?: boolean; status?: string }> {
    const normalizedSlug = slug.trim().toLowerCase();
    const config = await this.prisma.config.findFirst({
      where: { publicSlug: normalizedSlug },
      select: {
        userId: true,
        hasGatewayAddon: true,
        gatewayAccessToken: true,
        gatewayWebhookSecret: true,
      },
    });

    if (!config || !config.hasGatewayAddon || !config.gatewayAccessToken) {
      throw new NotFoundException('Gateway não configurado para esta loja.');
    }

    const topic = body?.type || body?.topic || query?.type || query?.topic;
    const rawId = body?.data?.id ?? query?.['data.id'] ?? query?.id;
    const paymentId = rawId !== undefined && rawId !== null ? String(rawId).trim() : '';

    if ((topic && topic !== 'payment') || !paymentId) {
      return { ignored: true };
    }

    if (config.gatewayWebhookSecret) {
      const valid = this.verifyWebhookSignature(headers, paymentId, config.gatewayWebhookSecret);
      if (!valid) {
        this.logger.warn(`Assinatura inválida no webhook Mercado Pago da loja ${normalizedSlug}`);
        throw new UnauthorizedException('Assinatura do webhook Mercado Pago inválida');
      }
    }

    const mpPayment = await this.fetchPaymentById(paymentId, config.gatewayAccessToken);
    const externalReference = mpPayment?.external_reference?.trim();
    if (!externalReference) {
      return { ignored: true };
    }

    const order = await this.prisma.order.findFirst({
      where: {
        id: externalReference,
        userId: config.userId,
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido do gateway não encontrado.');
    }

    const rawStatus = String(mpPayment.status || '').toLowerCase();
    const mappedStatus = this.mapPaymentStatus(rawStatus);
    const eventId = `${paymentId}:${rawStatus || mappedStatus}`;

    try {
      await this.prisma.paymentWebhookEvent.create({
        data: {
          provider: 'mercadopago',
          eventId,
          eventType: String(topic || 'payment'),
          gatewayOrderId: order.gatewayOrderId || order.id,
          gatewayTransactionId: paymentId,
          amount:
            mpPayment.transaction_amount !== undefined
              ? new Prisma.Decimal(mpPayment.transaction_amount)
              : null,
          payload: (body ?? {}) as Prisma.InputJsonValue,
          processedAt: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return { duplicate: true };
      }
      throw error;
    }

    if (mappedStatus === 'PAID') {
      const paidAmount = Number(mpPayment.transaction_amount ?? 0);
      const orderTotal = Number(order.total ?? 0);

      if (!Number.isFinite(paidAmount) || paidAmount + 0.01 < orderTotal) {
        this.logger.warn(
          `Divergência de valor detectada no pedido ${order.id}: pago=${paidAmount}, esperado=${orderTotal}`,
        );
        await this.prisma.order.update({
          where: { id: order.id },
          data: { gatewayStatus: 'AMOUNT_MISMATCH' },
        });
        return { duplicate: false, status: 'AMOUNT_MISMATCH' };
      }

      const method =
        String(mpPayment.payment_method_id || '').toLowerCase() === 'pix'
          ? PaymentMethod.PIX
          : PaymentMethod.CREDIT_CARD;

      await this.prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: {
            gatewayStatus: 'PAID',
            status: OrderStatus.PAGO,
            paymentMethod: method,
            financialRegistered: true,
          },
        });

        await tx.transaction.upsert({
          where: { legacyId: `mp:${paymentId}` },
          create: {
            userId: order.userId,
            orderId: order.id,
            type: 'VENDA',
            date: new Date(),
            amount: new Prisma.Decimal(paidAmount),
            description: `Venda online Mercado Pago (Pedido #${order.id.slice(0, 8).toUpperCase()})`,
            gatewayTransactionId: paymentId,
            legacyId: `mp:${paymentId}`,
          },
          update: {
            gatewayTransactionId: paymentId,
          },
        });
      });

      return { duplicate: false, status: 'PAID' };
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: { gatewayStatus: mappedStatus },
    });

    return { duplicate: false, status: mappedStatus };
  }

  private mapPaymentStatus(status: string): 'PAID' | 'PENDING' | 'REFUNDED' | 'FAILED' {
    switch (status) {
      case 'approved':
        return 'PAID';
      case 'pending':
      case 'in_process':
      case 'authorized':
        return 'PENDING';
      case 'refunded':
      case 'charged_back':
        return 'REFUNDED';
      default:
        return 'FAILED';
    }
  }
}
