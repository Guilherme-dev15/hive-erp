import { BadRequestException, Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { ProductStatus, OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { mapPublicCatalog } from './public-catalog.mapper';
import { PublicCatalogQueryDto } from './dto/public-catalog-query.dto';
import { PublicCatalogResponse } from './public-catalog.types';
import { CreatePublicOrderDto, PublicOrderResponse } from './dto/create-public-order.dto';
import { MercadoPagoService } from '../payments/mercado-pago.service';

const PUBLIC_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

@Injectable()
export class PublicCatalogService {
  private readonly logger = new Logger(PublicCatalogService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly mercadoPagoService?: MercadoPagoService,
  ) {}

  async getCatalog(query: PublicCatalogQueryDto): Promise<PublicCatalogResponse> {
    const slug = this.normalizeSlug(query.slug);

    const config = await this.prisma.config.findFirst({
      where: {
        publicSlug: slug,
        user: { active: true },
      },
      select: {
        userId: true,
        storeName: true,
        publicSlug: true,
        primaryColor: true,
        secondaryColor: true,
        whatsappNumber: true,
        banners: true,
        lowStockThreshold: true,
        checkoutMode: true,
        hasGatewayAddon: true,
        gatewayProvider: true,
        gatewayPublicKey: true,
      },
    });

    if (!config?.publicSlug) {
      throw new NotFoundException('Catálogo não encontrado');
    }

    const publicConfig = {
      ...config,
      publicSlug: config.publicSlug,
    };

    const products = await this.prisma.product.findMany({
      where: {
        userId: config.userId,
        status: ProductStatus.ATIVO,
      },
      select: {
        id: true,
        name: true,
        code: true,
        categoryId: true,
        subcategory: true,
        description: true,
        salePrice: true,
        imageUrl: true,
        quantity: true,
        status: true,
        variants: {
          where: {
            skuSuffix: { not: '__CAMPAIGN_BACKUP__' },
          },
          select: {
            id: true,
            skuSuffix: true,
            adjustmentValue: true,
            measurement: true,
            stock: true,
            onDemand: true,
          },
        },
      },
    });

    const categoryIds = [...new Set(
      products
        .map((product) => product.categoryId)
        .filter((categoryId): categoryId is string => Boolean(categoryId)),
    )];

    const categories = categoryIds.length === 0
      ? []
      : await this.prisma.category.findMany({
          where: {
            userId: config.userId,
            id: { in: categoryIds },
          },
          select: { id: true, name: true },
        });

    return mapPublicCatalog(publicConfig, products, categories);
  }

  async createOrder(
    dto: CreatePublicOrderDto,
    returnBaseUrl?: string,
  ): Promise<PublicOrderResponse> {
    const slug = this.normalizeSlug(dto.slug);

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('O pedido deve conter pelo menos um item');
    }

    const config = await this.prisma.config.findFirst({
      where: {
        publicSlug: slug,
        user: { active: true },
      },
      select: {
        userId: true,
        storeName: true,
        publicSlug: true,
        checkoutMode: true,
        hasGatewayAddon: true,
        gatewayAccessToken: true,
      },
    });

    if (!config?.userId) {
      throw new NotFoundException('Catálogo não encontrado');
    }

    const isGatewayCheckout = dto.paymentMethod === 'GATEWAY';
    if (isGatewayCheckout) {
      if (
        config.checkoutMode !== 'GATEWAY' ||
        !config.hasGatewayAddon ||
        !config.gatewayAccessToken
      ) {
        throw new BadRequestException(
          'Checkout online não está ativo ou configurado para esta loja.',
        );
      }
    }

    const tenantUserId = config.userId;

    const orderResult = await this.prisma.$transaction(async (tx) => {
      const resolvedItems: Array<{
        productId: string;
        name: string;
        code: string | null;
        salePrice: number;
        quantity: number;
        imageUrl: string | null;
      }> = [];

      for (const item of dto.items) {
        if (!item.productId) {
          throw new BadRequestException('Todos os itens do pedido devem informar productId válido.');
        }

        const product = await tx.product.findFirst({
          where: {
            id: item.productId,
            userId: tenantUserId,
            status: ProductStatus.ATIVO,
          },
          include: {
            variants: {
              where: {
                skuSuffix: { not: '__CAMPAIGN_BACKUP__' },
              },
            },
          },
        });

        if (!product) {
          throw new BadRequestException(
            `Produto ${item.name || item.productId} não encontrado no catálogo.`,
          );
        }

        const unitPrice = this.resolveAuthoritativeUnitPrice(product, item);

        const decremented = await tx.product.updateMany({
          where: {
            id: product.id,
            userId: tenantUserId,
            status: ProductStatus.ATIVO,
            quantity: { gte: item.quantity },
          },
          data: { quantity: { decrement: item.quantity } },
        });

        if (!decremented || decremented.count === 0) {
          throw new BadRequestException(
            `Estoque insuficiente para o produto ${product.name}. Disponível: ${product.quantity}, Solicitado: ${item.quantity}`,
          );
        }

        const newQuantity = Math.max(0, Number(product.quantity) - item.quantity);

        await tx.inventoryLog.create({
          data: {
            productId: product.id,
            userId: tenantUserId,
            type: 'VENDA_CATALOGO',
            change: item.quantity,
            newQuantity,
            userName: dto.customerName.trim(),
          },
        });

        resolvedItems.push({
          productId: product.id,
          name: product.name,
          code: product.code ?? null,
          salePrice: unitPrice,
          quantity: item.quantity,
          imageUrl: product.imageUrl ?? null,
        });
      }

      const serverSubtotal = Number(
        resolvedItems.reduce((acc, item) => acc + item.salePrice * item.quantity, 0).toFixed(2),
      );
      const serverDiscount = 0;
      const serverTotal = serverSubtotal;

      const order = await tx.order.create({
        data: {
          userId: tenantUserId,
          customerName: dto.customerName.trim(),
          customerPhone: dto.customerPhone ? dto.customerPhone.trim() : '',
          status: OrderStatus.AGUARDANDO_PAGAMENTO,
          subtotal: serverSubtotal,
          discount: serverDiscount,
          total: serverTotal,
          notes: dto.notes ? dto.notes.trim() : null,
          ...(isGatewayCheckout ? { gatewayStatus: 'PENDING' } : {}),
          items: {
            create: resolvedItems,
          },
        },
        include: { items: true },
      });

      return {
        order,
        resolvedItems,
        serverTotal,
      };
    });

    const baseResponse: PublicOrderResponse = {
      success: true,
      orderId: orderResult.order.id,
      status: orderResult.order.status,
      total: Number(orderResult.order.total),
      createdAt: orderResult.order.createdAt,
    };

    if (isGatewayCheckout && this.mercadoPagoService && config.gatewayAccessToken) {
      try {
        const pref = await this.mercadoPagoService.createCheckoutPreference({
          orderId: orderResult.order.id,
          storeName: config.storeName || 'Loja Virtual',
          slug: config.publicSlug || slug,
          customerName: dto.customerName.trim(),
          encryptedAccessToken: config.gatewayAccessToken,
          items: orderResult.resolvedItems.map((item) => ({
            id: item.productId,
            title: item.name,
            quantity: item.quantity,
            unitPrice: item.salePrice,
          })),
          returnBaseUrl,
        });

        await this.prisma.order.update({
          where: { id: orderResult.order.id },
          data: {
            gatewayOrderId: pref.preferenceId,
            gatewayPaymentUrl: pref.paymentUrl,
            gatewayStatus: 'PENDING',
          },
        });

        return {
          ...baseResponse,
          paymentUrl: pref.paymentUrl,
          preferenceId: pref.preferenceId,
        };
      } catch (mpError) {
        this.logger.warn(
          `Falha ao criar preferência MP para pedido ${orderResult.order.id}. Executando estorno compensatório de estoque.`,
        );
        await this.rollbackFailedGatewayOrder(
          orderResult.order.id,
          tenantUserId,
          orderResult.resolvedItems,
        );
        throw mpError;
      }
    }

    return baseResponse;
  }

  private async rollbackFailedGatewayOrder(
    orderId: string,
    userId: string,
    items: Array<{ productId: string; quantity: number }>,
  ): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.CANCELADO,
            gatewayStatus: 'FAILED',
          },
        });

        for (const item of items) {
          const updated = await tx.product.update({
            where: { id: item.productId },
            data: { quantity: { increment: item.quantity } },
          });
          await tx.inventoryLog.create({
            data: {
              productId: item.productId,
              userId,
              type: 'ESTORNO_GATEWAY_ERRO',
              change: item.quantity,
              newQuantity: updated?.quantity ?? item.quantity,
              userName: 'Sistema',
            },
          });
        }
      });
    } catch (rollbackErr) {
      this.logger.error(`Erro no rollback compensatório do pedido ${orderId}:`, rollbackErr);
    }
  }

  private computeVariantPrice(basePrice: number, adjustmentValue: unknown): number {
    const ajuste = Number(adjustmentValue) || 0;
    if (ajuste > 0) {
      if (basePrice === 0 || ajuste >= basePrice * 0.5) {
        return Number(ajuste.toFixed(2));
      }
      return Number((basePrice + ajuste).toFixed(2));
    }
    return Number(basePrice.toFixed(2));
  }

  private resolveAuthoritativeUnitPrice(
    product: { salePrice: unknown; variants?: Array<{ id: string; adjustmentValue: unknown }> },
    item: { variantId?: string; salePrice?: number },
  ): number {
    const basePrice = Number(product.salePrice) || 0;
    const variants = Array.isArray(product.variants) ? product.variants : [];

    if (item.variantId) {
      const matched = variants.find((v) => v.id === item.variantId);
      if (!matched) {
        throw new BadRequestException('Variação selecionada não encontrada para este produto.');
      }
      return this.computeVariantPrice(basePrice, matched.adjustmentValue);
    }

    if (variants.length > 0 && item.salePrice !== undefined) {
      const clientPrice = Number(item.salePrice);
      const matchingVariant = variants.find(
        (v) => Math.abs(this.computeVariantPrice(basePrice, v.adjustmentValue) - clientPrice) <= 0.01,
      );
      if (matchingVariant) {
        return this.computeVariantPrice(basePrice, matchingVariant.adjustmentValue);
      }
    }

    return Number(basePrice.toFixed(2));
  }

  private normalizeSlug(slug: string | undefined): string {
    if (!slug) {
      throw new BadRequestException('slug é obrigatório');
    }

    const normalizedSlug = slug.trim().toLowerCase();
    if (!PUBLIC_SLUG_PATTERN.test(normalizedSlug) || normalizedSlug.length < 3 || normalizedSlug.length > 63) {
      throw new BadRequestException('slug inválido');
    }

    return normalizedSlug;
  }
}
