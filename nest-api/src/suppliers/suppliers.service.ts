import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.supplier.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async create(userId: string, dto: CreateSupplierDto) {
    return this.prisma.supplier.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateSupplierDto) {
    const existing = await this.prisma.supplier.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    return this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.supplier.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    await this.prisma.supplier.delete({
      where: { id },
    });

    return { success: true, id };
  }
}
