import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { CouponStatus } from '@prisma/client';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.coupon.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, data: CreateCouponDto) {
    return this.prisma.coupon.create({
      data: {
        ...data,
        userId,
        code: data.code.toUpperCase(),
        status: CouponStatus.ATIVO,
      },
    });
  }

  async remove(userId: string, id: string) {
    const coupon = await this.prisma.coupon.findFirst({
      where: { id, userId },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    return this.prisma.coupon.delete({
      where: { id },
    });
  }
}
