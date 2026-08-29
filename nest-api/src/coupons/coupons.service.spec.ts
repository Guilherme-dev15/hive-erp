import { Test, TestingModule } from '@nestjs/testing';
import { CouponsService } from './coupons.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CouponsService', () => {
  let service: CouponsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponsService,
        {
          provide: PrismaService,
          useValue: {
            coupon: {
              findMany: jest.fn(),
              create: jest.fn(),
              findFirst: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CouponsService>(CouponsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return coupons for user', async () => {
    const userId = 'tenant-123';
    const mockCoupons = [{ id: '1', code: 'PROMO10' }];
    
    (prisma.coupon.findMany as jest.Mock).mockResolvedValue(mockCoupons);

    const result = await service.findAll(userId);
    expect(result).toEqual(mockCoupons);
    expect(prisma.coupon.findMany).toHaveBeenCalledWith({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('should create coupon', async () => {
    const userId = 'tenant-123';
    const dto = { code: 'promo20', discountPercent: 20 };
    const mockCreated = { id: '1', code: 'PROMO20', discountPercent: 20 };
    
    (prisma.coupon.create as jest.Mock).mockResolvedValue(mockCreated);

    const result = await service.create(userId, dto);
    
    expect(prisma.coupon.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId,
        code: 'PROMO20',
        discountPercent: 20,
      }),
    });
    expect(result).toEqual(mockCreated);
  });

  it('should delete coupon if user owns it', async () => {
    const userId = 'tenant-123';
    const couponId = 'c1';
    
    (prisma.coupon.findFirst as jest.Mock).mockResolvedValue({ id: couponId, userId });
    (prisma.coupon.delete as jest.Mock).mockResolvedValue({ id: couponId });

    await service.remove(userId, couponId);
    
    expect(prisma.coupon.findFirst).toHaveBeenCalledWith({ where: { id: couponId, userId } });
    expect(prisma.coupon.delete).toHaveBeenCalledWith({ where: { id: couponId } });
  });

  it('should throw NotFoundException if trying to delete coupon not owned by user', async () => {
    const userId = 'tenant-123';
    const couponId = 'c1';
    
    (prisma.coupon.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(service.remove(userId, couponId)).rejects.toThrow(NotFoundException);
    expect(prisma.coupon.delete).not.toHaveBeenCalled();
  });
});
