import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    if (data.legacyId) {
      return this.prisma.order.upsert({
        where: { legacyId: data.legacyId },
        update: {
          customerName: data.customerName || 'Cliente Legado',
          status: data.status || 'AGUARDANDO_PAGAMENTO',
          total: data.total || 0,
          updatedAt: new Date()
        },
        create: {
          customerName: data.customerName || 'Cliente Legado',
          status: data.status || 'AGUARDANDO_PAGAMENTO',
          total: data.total || 0,
          legacyId: data.legacyId,
          user: {
            connectOrCreate: {
              where: { email: 'admin@hive.com' },
              create: { email: 'admin@hive.com', name: 'Admin', active: true }
            }
          }
        }
      });
    }

    return this.prisma.order.create({
      data: {
        customerName: data.customerName || 'Cliente Legado',
        status: data.status || 'AGUARDANDO_PAGAMENTO',
        total: data.total || 0,
        legacyId: data.legacyId,
        user: {
          connectOrCreate: {
            where: { email: 'admin@hive.com' },
            create: { email: 'admin@hive.com', name: 'Admin', active: true }
          }
        }
      }
    });
  }

  async update(id: string, data: any) {
    return this.prisma.order.update({
      where: { id },
      data: {
        customerName: data.customerName,
        status: data.status,
        total: data.total,
      }
    });
  }
}
