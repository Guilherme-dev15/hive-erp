import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany();
  }

  async findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
    });
  }

  async create(data: any) {
    // Para simplificar no dual write, lidamos com upsert
    if (data.legacyId) {
      return this.prisma.product.upsert({
        where: { legacyId: data.legacyId },
        update: {
          name: data.name,
          salePrice: data.salePrice || 0,
          quantity: data.quantity || 0,
          status: data.status || 'ATIVO',
          updatedAt: new Date()
        },
        create: {
          name: data.name,
          salePrice: data.salePrice || 0,
          quantity: data.quantity || 0,
          status: data.status || 'ATIVO',
          legacyId: data.legacyId,
          // Hack: we need a user context, this should come from auth/tenancy
          user: {
            connectOrCreate: {
              where: { email: 'admin@hive.com' },
              create: { email: 'admin@hive.com', name: 'Admin', active: true }
            }
          }
        }
      });
    }
    
    // Fallback normal create
    return this.prisma.product.create({
      data: {
        name: data.name,
        salePrice: data.salePrice || 0,
        quantity: data.quantity || 0,
        status: data.status || 'ATIVO',
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
    return this.prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        salePrice: data.salePrice,
        quantity: data.quantity,
        status: data.status,
      }
    });
  }
}
