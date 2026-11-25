import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CustomerSummary,
  CustomersQueryDto,
  CustomersListResponse,
} from './customers.types';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  private cleanPhone(phone: string | null | undefined): string {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
  }

  private generateCustomerId(name: string, phone: string | null | undefined): string {
    const clean = this.cleanPhone(phone);
    if (clean) return clean;
    const cleanName = (name || 'sem-nome')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-');
    return `cliente-${cleanName}`;
  }

  async findAll(
    userId: string,
    query?: CustomersQueryDto
  ): Promise<CustomersListResponse> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!orders || orders.length === 0) {
      return {
        data: [],
        total: 0,
        totalRevenue: 0,
        averageTicketGlobal: 0,
      };
    }

    const customersMap = new Map<string, CustomerSummary>();
    let totalRevenue = 0;

    for (const order of orders) {
      const orderTotal = Number(order.total) || 0;
      totalRevenue += orderTotal;

      const customerId = this.generateCustomerId(
        order.customerName,
        order.customerPhone
      );
      const cleanPhone = this.cleanPhone(order.customerPhone);

      let customer = customersMap.get(customerId);
      if (!customer) {
        customer = {
          id: customerId,
          name: order.customerName || 'Cliente sem Nome',
          phone: order.customerPhone || '',
          cleanPhone,
          totalOrders: 0,
          totalSpent: 0,
          averageTicket: 0,
          firstOrderDate: order.createdAt,
          lastOrderDate: order.createdAt,
          lastOrderStatus: order.status,
          orders: [],
        };
        customersMap.set(customerId, customer);
      }

      customer.totalOrders += 1;
      customer.totalSpent += orderTotal;
      if (order.createdAt > customer.lastOrderDate) {
        customer.lastOrderDate = order.createdAt;
        customer.lastOrderStatus = order.status;
      }
      if (order.createdAt < customer.firstOrderDate) {
        customer.firstOrderDate = order.createdAt;
      }

      customer.orders.push({
        id: order.id,
        total: orderTotal,
        status: order.status,
        createdAt: order.createdAt,
        itemsCount: order.items ? order.items.length : 0,
      });
    }

    // Calcula ticket médio de cada cliente
    let customersList = Array.from(customersMap.values()).map((c) => ({
      ...c,
      totalSpent: Number(c.totalSpent.toFixed(2)),
      averageTicket: Number((c.totalSpent / c.totalOrders).toFixed(2)),
    }));

    // Filtro de busca
    if (query?.search) {
      const term = query.search.toLowerCase().trim();
      customersList = customersList.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.cleanPhone.includes(term) ||
          c.phone.includes(term)
      );
    }

    // Ordenação
    const sortBy = query?.sortBy || 'totalSpent';
    const sortOrder = query?.sortOrder || 'desc';

    customersList.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'totalOrders') {
        comparison = a.totalOrders - b.totalOrders;
      } else if (sortBy === 'lastOrderDate') {
        comparison =
          new Date(a.lastOrderDate).getTime() -
          new Date(b.lastOrderDate).getTime();
      } else {
        // totalSpent padrão
        comparison = a.totalSpent - b.totalSpent;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    const averageTicketGlobal =
      orders.length > 0 ? Number((totalRevenue / orders.length).toFixed(2)) : 0;

    return {
      data: customersList,
      total: customersList.length,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      averageTicketGlobal,
    };
  }

  async findOne(userId: string, idOrPhone: string): Promise<CustomerSummary> {
    const list = await this.findAll(userId);
    const clean = this.cleanPhone(idOrPhone);

    const customer = list.data.find(
      (c) =>
        c.id === idOrPhone ||
        (clean && c.cleanPhone === clean) ||
        c.cleanPhone === idOrPhone
    );

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return customer;
  }
}
