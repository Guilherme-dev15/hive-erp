import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ProductStatus, OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { mapPublicCatalog } from './public-catalog.mapper';
import { PublicCatalogQueryDto } from './dto/public-catalog-query.dto';
import { PublicCatalogResponse } from './public-catalog.types';
import { CreatePublicOrderDto, PublicOrderResponse } from './dto/create-public-order.dto';

const PUBLIC_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

@Injectable()
export class PublicCatalogService {
  constructor(private readonly prisma: PrismaService) {}

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

  async createOrder(dto: CreatePublicOrderDto): Promise<PublicOrderResponse> {
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
      },
    });

    if (!config?.userId) {
      throw new NotFoundException('Catálogo não encontrado');
    }

    const tenantUserId = config.userId;

    return this.prisma.$transaction(async (tx) => {
      // 1. Validar e decrementar estoque atomicamente
      for (const item of dto.items) {
        if (item.productId) {
          const product = await tx.product.findFirst({
            where: {
              id: item.productId,
              userId: tenantUserId,
              status: ProductStatus.ATIVO,
            },
          });

          if (!product) {
            throw new BadRequestException(`Produto ${item.name} não encontrado no catálogo.`);
          }

          if (product.quantity < item.quantity) {
            throw new BadRequestException(
              `Estoque insuficiente para o produto ${product.name}. Disponível: ${product.quantity}, Solicitado: ${item.quantity}`,
            );
          }

          const updatedProduct = await tx.product.update({
            where: { id: product.id },
            data: { quantity: { decrement: item.quantity } },
          });

          await tx.inventoryLog.create({
            data: {
              productId: product.id,
              userId: tenantUserId,
              type: 'VENDA_CATALOGO',
              change: item.quantity,
              newQuantity: updatedProduct?.quantity ?? 0,
              userName: dto.customerName.trim(),
            },
          });
        }
      }

      // 2. Criar a ordem com itens vinculados
      const order = await tx.order.create({
        data: {
          userId: tenantUserId,
          customerName: dto.customerName.trim(),
          customerPhone: dto.customerPhone ? dto.customerPhone.trim() : '',
          status: OrderStatus.AGUARDANDO_PAGAMENTO,
          subtotal: dto.subtotal,
          discount: dto.discount || 0,
          total: dto.total,
          notes: dto.notes ? dto.notes.trim() : null,
          items: {
            create: dto.items.map((item) => ({
              productId: item.productId,
              name: item.name,
              code: item.code,
              salePrice: item.salePrice,
              quantity: item.quantity,
              imageUrl: item.imageUrl,
            })),
          },
        },
        include: { items: true },
      });

      return {
        success: true,
        orderId: order.id,
        status: order.status,
        total: Number(order.total),
        createdAt: order.createdAt,
      };
    });
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
