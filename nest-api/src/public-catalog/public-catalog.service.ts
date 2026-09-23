import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { mapPublicCatalog } from './public-catalog.mapper';
import { PublicCatalogQueryDto } from './dto/public-catalog-query.dto';
import { PublicCatalogResponse } from './public-catalog.types';

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
