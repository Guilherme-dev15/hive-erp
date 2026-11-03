import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { BulkMarkupDto, BulkStatusDto } from './dto/bulk-update.dto';
import { ProductStatus } from '@prisma/client';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private mapProductToResponse(product: any, categoryMap?: Map<string, string>) {
    if (!product) return null;

    const categoryName =
      (product.categoryId && categoryMap?.get(product.categoryId)) ||
      product.category?.name ||
      product.subcategory ||
      '';

    return {
      id: product.id,
      name: product.name,
      code: product.code || '',
      category: categoryName,
      categoryId: product.categoryId || null,
      subcategory: product.subcategory || '',
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      costPrice: Number(product.costPrice || 0),
      salePrice: Number(product.salePrice || 0),
      marginPercent:
        product.marginPercent !== null && product.marginPercent !== undefined
          ? Number(product.marginPercent)
          : undefined,
      quantity: product.quantity,
      weight: Number(product.weight || 0),
      status: String(product.status).toUpperCase() === 'INATIVO' ? 'inativo' : 'ativo',
      supplierId: product.supplierId || '',
      supplierProductUrl: product.supplierProductUrl || '',
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      legacyId: product.legacyId,
      variantes: (product.variants || []).map((v: any) => ({
        id: v.id,
        sku_sufixo: v.skuSuffix,
        valor_ajuste: Number(v.adjustmentValue),
        medida: v.measurement || '',
        estoque: v.stock,
        sob_consulta: v.onDemand,
      })),
    };
  }

  private async resolveCategoryId(
    userId: string,
    categoryId?: string,
    categoryName?: string,
  ): Promise<string | null> {
    if (categoryId && UUID_REGEX.test(categoryId.trim())) {
      return categoryId.trim();
    }

    if (categoryName && categoryName.trim() && this.prisma.category) {
      const trimmed = categoryName.trim();
      try {
        const existing = await this.prisma.category.findFirst({
          where: {
            userId,
            name: { equals: trimmed, mode: 'insensitive' },
          },
        });

        if (existing) {
          return existing.id;
        }

        const created = await this.prisma.category.create({
          data: {
            userId,
            name: trimmed.toUpperCase(),
          },
        });
        return created.id;
      } catch {
        // Fallback gracefully
      }
    }

    return null;
  }

  private resolveSupplierId(supplierId?: string): string | null {
    if (supplierId && UUID_REGEX.test(supplierId.trim())) {
      return supplierId.trim();
    }
    return null;
  }

  private resolveStatus(status?: any): ProductStatus {
    if (typeof status === 'string' && status.trim().toUpperCase() === 'INATIVO') {
      return ProductStatus.INATIVO;
    }
    return ProductStatus.ATIVO;
  }

  async findAll(userId: string) {
    const products = await this.prisma.product.findMany({
      where: { userId },
    });

    let categoryMap: Map<string, string> | undefined;
    if (this.prisma.category?.findMany) {
      try {
        const categories = await this.prisma.category.findMany({
          where: { userId },
        });
        if (Array.isArray(categories)) {
          categoryMap = new Map(categories.map((c) => [c.id, c.name]));
        }
      } catch {
        // Fallback
      }
    }

    return products.map((p) => this.mapProductToResponse(p, categoryMap));
  }

  async findOne(id: string, userId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, userId },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    let categoryMap: Map<string, string> | undefined;
    if (product.categoryId && this.prisma.category?.findUnique) {
      try {
        const cat = await this.prisma.category.findUnique({
          where: { id: product.categoryId },
        });
        if (cat) {
          categoryMap = new Map([[cat.id, cat.name]]);
        }
      } catch {
        // Fallback
      }
    }

    return this.mapProductToResponse(product, categoryMap);
  }

  async create(data: CreateProductDto, userId: string) {
    const categoryId = await this.resolveCategoryId(userId, data.categoryId, data.category);
    const supplierId = this.resolveSupplierId(data.supplierId);
    const status = this.resolveStatus(data.status);

    const { category, markup, gramPrice, cm, mm, variantes, ...cleanData } = data;

    const createPayload: any = {
      name: cleanData.name,
      code: cleanData.code || undefined,
      categoryId: categoryId || undefined,
      subcategory: cleanData.subcategory || undefined,
      description: cleanData.description || undefined,
      imageUrl: cleanData.imageUrl || undefined,
      costPrice: cleanData.costPrice !== undefined ? cleanData.costPrice : 0,
      salePrice: cleanData.salePrice !== undefined ? cleanData.salePrice : 0,
      marginPercent: cleanData.marginPercent !== undefined ? cleanData.marginPercent : undefined,
      quantity: cleanData.quantity !== undefined ? cleanData.quantity : 0,
      weight: cleanData.weight !== undefined ? cleanData.weight : undefined,
      status,
      supplierId: supplierId || undefined,
      supplierProductUrl: cleanData.supplierProductUrl || undefined,
      legacyId: cleanData.legacyId || undefined,
      userId,
    };

    if (data.legacyId) {
      const upserted = await this.prisma.product.upsert({
        where: { legacyId: data.legacyId },
        update: {
          ...createPayload,
          updatedAt: new Date(),
        },
        create: createPayload,
      });
      return this.mapProductToResponse(upserted);
    }

    const created = await this.prisma.product.create({
      data: createPayload,
    });

    return this.mapProductToResponse(created);
  }

  async update(id: string, data: UpdateProductDto, userId: string) {
    let categoryId: string | null | undefined = undefined;
    if (data.categoryId !== undefined || data.category !== undefined) {
      categoryId = await this.resolveCategoryId(userId, data.categoryId, data.category);
    }

    let supplierId: string | null | undefined = undefined;
    if (data.supplierId !== undefined) {
      supplierId = this.resolveSupplierId(data.supplierId);
    }

    let status: ProductStatus | undefined = undefined;
    if (data.status !== undefined) {
      status = this.resolveStatus(data.status);
    }

    const { category, markup, gramPrice, cm, mm, variantes, ...cleanData } = data;

    const updatePayload: any = {
      ...(cleanData.name !== undefined ? { name: cleanData.name } : {}),
      ...(cleanData.code !== undefined ? { code: cleanData.code } : {}),
      ...(categoryId !== undefined ? { categoryId } : {}),
      ...(cleanData.subcategory !== undefined ? { subcategory: cleanData.subcategory } : {}),
      ...(cleanData.description !== undefined ? { description: cleanData.description } : {}),
      ...(cleanData.imageUrl !== undefined ? { imageUrl: cleanData.imageUrl } : {}),
      ...(cleanData.costPrice !== undefined ? { costPrice: cleanData.costPrice } : {}),
      ...(cleanData.salePrice !== undefined ? { salePrice: cleanData.salePrice } : {}),
      ...(cleanData.marginPercent !== undefined ? { marginPercent: cleanData.marginPercent } : {}),
      ...(cleanData.quantity !== undefined ? { quantity: cleanData.quantity } : {}),
      ...(cleanData.weight !== undefined ? { weight: cleanData.weight } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(supplierId !== undefined ? { supplierId } : {}),
      ...(cleanData.supplierProductUrl !== undefined ? { supplierProductUrl: cleanData.supplierProductUrl } : {}),
    };

    const result = await this.prisma.product.updateMany({
      where: { id, userId },
      data: updatePayload,
    });

    if (result.count === 0) {
      throw new NotFoundException('Produto não encontrado');
    }

    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.product.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Produto não encontrado');
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return { success: true, id };
  }

  async importBulk(products: any[], userId: string) {
    let count = 0;
    for (const prod of products) {
      await this.create(prod, userId);
      count++;
    }
    return { count };
  }

  /**
   * M3: Calculo em lote importado do Client SDK
   */
  async updateBulkMarkup(data: BulkMarkupDto, userId: string) {
    const products = await this.prisma.product.findMany({
      where: {
        userId,
        OR: [
          { categoryId: data.categoryId },
          { category: { legacyId: data.categoryId } },
          { category: { name: data.categoryId } },
        ],
      },
    });

    if (products.length === 0) return { updatedCount: 0 };

    const updatePromises = products.map((product) => {
      let newSalePrice = Number(product.salePrice);
      const weight = Number(product.weight || 0);
      const costPrice = Number(product.costPrice || 0);
      const gramPrice = data.globalGramPrice || 0;

      if (weight > 0 && gramPrice > 0) {
        newSalePrice = weight * gramPrice * data.markup;
      } else if (costPrice > 0) {
        newSalePrice = costPrice * data.markup;
      }

      return this.prisma.product.update({
        where: { id: product.id },
        data: {
          marginPercent: data.markup,
          salePrice: newSalePrice,
        },
      });
    });

    await this.prisma.$transaction(updatePromises);
    return { updatedCount: products.length };
  }

  /**
   * M3: Status em lote
   */
  async updateBulkStatus(data: BulkStatusDto, userId: string) {
    if (data.productIds.length === 0) return { updatedCount: 0 };

    const updateQuery = await this.prisma.product.updateMany({
      where: {
        userId,
        OR: [
          { id: { in: data.productIds } },
          { legacyId: { in: data.productIds } },
        ],
      },
      data: {
        status: data.status,
      },
    });

    return { updatedCount: updateQuery.count };
  }
}
