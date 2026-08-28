import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  async create(data: CreateTransactionDto, userId: string) {
    return this.prisma.transaction.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async remove(id: string, userId: string) {
    return this.prisma.transaction.deleteMany({
      where: { id, userId },
    });
  }
}
