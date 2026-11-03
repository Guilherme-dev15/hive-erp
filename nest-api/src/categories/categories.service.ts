import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async create(userId: string, dto: CreateCategoryDto) {
    const normalizedName = dto.name.trim();

    const existing = await this.prisma.category.findFirst({
      where: {
        userId,
        name: { equals: normalizedName, mode: 'insensitive' },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.category.create({
      data: {
        name: normalizedName,
        userId,
      },
    });
  }

  async remove(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { success: true, id };
  }
}
