import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { BulkMarkupDto, BulkStatusDto } from './dto/bulk-update.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.product.findMany({
      where: { userId },
    });
  }

  async findOne(id: string, userId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, userId },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }
    return product;
  }

  async create(data: CreateProductDto, userId: string) {
    if (data.legacyId) {
      return this.prisma.product.upsert({
        where: { legacyId: data.legacyId },
        update: {
          ...data,
          updatedAt: new Date()
        },
        create: {
          ...data,
          userId
        }
      });
    }

    return this.prisma.product.create({
      data: {
        ...data,
        userId
      }
    });
  }

  async update(id: string, data: UpdateProductDto, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.product.update({
      where: { id },
      data
    });
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
          { category: { name: data.categoryId } }
        ]
      }
    });

    if (products.length === 0) return { updatedCount: 0 };

    const updatePromises = products.map(product => {
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
          salePrice: newSalePrice
        }
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
          { legacyId: { in: data.productIds } }
        ]
      },
      data: {
        status: data.status
      }
    });

    return { updatedCount: updateQuery.count };
  }
}
