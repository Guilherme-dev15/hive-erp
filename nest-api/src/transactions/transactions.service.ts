import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionType } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, filter?: { status?: string; type?: TransactionType }) {
    const where: any = { userId };
    if (filter?.status) where.status = filter.status;
    if (filter?.type) where.type = filter.type;

    return this.prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  async create(data: CreateTransactionDto, userId: string) {
    return this.prisma.transaction.create({
      data: {
        ...data,
        userId,
        status: data.status || 'PAGO',
      },
    });
  }

  async updateStatus(id: string, status: string, userId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
    });
    if (!transaction) {
      throw new NotFoundException('Transação não encontrada');
    }

    return this.prisma.transaction.update({
      where: { id },
      data: { status },
    });
  }

  async remove(id: string, userId: string) {
    return this.prisma.transaction.deleteMany({
      where: { id, userId },
    });
  }
}
