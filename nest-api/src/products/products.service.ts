import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

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
    // Para simplificar no dual write, lidamos com upsert
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

    // Fallback normal create
    return this.prisma.product.create({
      data: {
        ...data,
        userId
      }
    });
  }

  async update(id: string, data: UpdateProductDto, userId: string) {
    // Verifica se o produto pertence ao usuário
    await this.findOne(id, userId);

    return this.prisma.product.update({
      where: { id },
      data
    });
  }
}
