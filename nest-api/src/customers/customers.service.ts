import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { userId },
      include: {
        orders: {
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return customers.map((c) => {
      const totalSpent = c.orders
        .filter((o) => o.status !== 'CANCELADO')
        .reduce((acc, o) => acc + Number(o.total || 0), 0);

      return {
        ...c,
        ordersCount: c.orders.length,
        totalSpent,
      };
    });
  }

  async findOne(id: string, userId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, userId },
      include: {
        orders: {
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const totalSpent = customer.orders
      .filter((o) => o.status !== 'CANCELADO')
      .reduce((acc, o) => acc + Number(o.total || 0), 0);

    return {
      ...customer,
      ordersCount: customer.orders.length,
      totalSpent,
    };
  }

  async create(data: CreateCustomerDto, userId: string) {
    return this.prisma.customer.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async update(id: string, data: UpdateCustomerDto, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.customer.delete({
      where: { id },
    });
  }

  async importBulk(items: CreateCustomerDto[], userId: string) {
    const results = [];
    for (const item of items) {
      if (!item.name) continue;
      const created = await this.prisma.customer.create({
        data: {
          name: item.name,
          email: item.email || null,
          phone: item.phone || null,
          document: item.document || null,
          address: item.address || null,
          city: item.city || null,
          state: item.state || null,
          zipCode: item.zipCode || null,
          notes: item.notes || null,
          userId,
        },
      });
      results.push(created);
    }
    return { count: results.length };
  }
}
