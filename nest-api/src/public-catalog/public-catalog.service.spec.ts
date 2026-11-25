import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductStatus, OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PublicCatalogService } from './public-catalog.service';

describe('PublicCatalogService', () => {
  let service: PublicCatalogService;
  let prisma: {
    config: { findFirst: jest.Mock };
    product: { findMany: jest.Mock; findFirst: jest.Mock; update: jest.Mock };
    category: { findMany: jest.Mock };
    order: { create: jest.Mock };
    inventoryLog: { create: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      config: { findFirst: jest.fn() },
      product: { findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      category: { findMany: jest.fn() },
      order: { create: jest.fn() },
      inventoryLog: { create: jest.fn() },
      $transaction: jest.fn().mockImplementation((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicCatalogService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(PublicCatalogService);
  });

  it('rejects a missing slug before querying the database', async () => {
    await expect(service.getCatalog({})).rejects.toThrow('slug é obrigatório');
    expect(prisma.config.findFirst).not.toHaveBeenCalled();
  });

  it('rejects malformed slugs before querying the database', async () => {
    await expect(service.getCatalog({ slug: 'https://tenant.example' })).rejects.toThrow('slug inválido');
    expect(prisma.config.findFirst).not.toHaveBeenCalled();
  });

  it('resolves the tenant server-side and scopes every catalog query', async () => {
    prisma.config.findFirst.mockResolvedValue({
      userId: 'tenant-a',
      storeName: 'Hive',
      publicSlug: 'hive',
      primaryColor: '#D4AF37',
      secondaryColor: '#343434',
      whatsappNumber: null,
      banners: [],
      lowStockThreshold: 5,
    });
    prisma.product.findMany.mockResolvedValue([
      {
        id: 'product-a',
        name: 'Produto A',
        code: null,
        categoryId: 'category-a',
        subcategory: null,
        description: null,
        salePrice: 10,
        imageUrl: null,
        quantity: 1,
        status: ProductStatus.ATIVO,
        variants: [],
      },
    ]);
    prisma.category.findMany.mockResolvedValue([{ id: 'category-a', name: 'Categoria A' }]);

    await expect(service.getCatalog({ slug: ' HIVE ' })).resolves.toMatchObject({
      version: 'v1',
      data: { config: { slug: 'hive' }, produtos: [{ id: 'product-a' }] },
    });

    expect(prisma.config.findFirst).toHaveBeenCalledWith({
      where: { publicSlug: 'hive', user: { active: true } },
      select: {
        userId: true,
        storeName: true,
        publicSlug: true,
        primaryColor: true,
        secondaryColor: true,
        whatsappNumber: true,
        banners: true,
        lowStockThreshold: true,
      },
    });
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: { userId: 'tenant-a', status: ProductStatus.ATIVO },
      select: expect.objectContaining({
        id: true,
        name: true,
        variants: expect.any(Object),
      }),
    });
    expect(prisma.category.findMany).toHaveBeenCalledWith({
      where: { userId: 'tenant-a', id: { in: ['category-a'] } },
      select: { id: true, name: true },
    });
  });

  it('does not publish an unknown or inactive tenant', async () => {
    prisma.config.findFirst.mockResolvedValue(null);

    await expect(service.getCatalog({ slug: 'hive' })).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  describe('createOrder (Public Orders)', () => {
    const validDto = {
      slug: 'hive',
      customerName: 'Cliente Teste',
      customerPhone: '11999998888',
      subtotal: 100,
      discount: 0,
      total: 100,
      notes: 'Entregar de manhã',
      items: [
        {
          productId: 'prod-1',
          name: 'Colar de Prata',
          salePrice: 100,
          quantity: 2,
        },
      ],
    };

    it('rejects order creation if tenant slug is not found', async () => {
      prisma.config.findFirst.mockResolvedValue(null);

      await expect(service.createOrder(validDto)).rejects.toThrow(NotFoundException);
    });

    it('rejects order creation if items array is empty', async () => {
      prisma.config.findFirst.mockResolvedValue({
        userId: 'tenant-1',
        publicSlug: 'hive',
      });

      await expect(
        service.createOrder({ ...validDto, items: [] }),
      ).rejects.toThrow('O pedido deve conter pelo menos um item');
    });

    it('rejects order if product does not exist or has insufficient stock', async () => {
      prisma.config.findFirst.mockResolvedValue({
        userId: 'tenant-1',
        publicSlug: 'hive',
      });
      prisma.product.findFirst.mockResolvedValue({
        id: 'prod-1',
        name: 'Colar de Prata',
        quantity: 1, // Only 1 in stock, requested 2
        status: ProductStatus.ATIVO,
      });

      await expect(service.createOrder(validDto)).rejects.toThrow(
        /Estoque insuficiente/,
      );
      expect(prisma.order.create).not.toHaveBeenCalled();
    });

    it('creates order, decrements stock atomically, logs inventory, and returns confirmation', async () => {
      prisma.config.findFirst.mockResolvedValue({
        userId: 'tenant-1',
        publicSlug: 'hive',
      });
      prisma.product.findFirst.mockResolvedValue({
        id: 'prod-1',
        name: 'Colar de Prata',
        quantity: 10,
        status: ProductStatus.ATIVO,
      });
      prisma.product.update.mockResolvedValue({
        id: 'prod-1',
        quantity: 8,
      });
      const fakeOrderDate = new Date();
      prisma.order.create.mockResolvedValue({
        id: 'order-123',
        status: OrderStatus.AGUARDANDO_PAGAMENTO,
        total: 100,
        createdAt: fakeOrderDate,
      });

      const res = await service.createOrder(validDto);

      expect(res).toEqual({
        success: true,
        orderId: 'order-123',
        status: OrderStatus.AGUARDANDO_PAGAMENTO,
        total: 100,
        createdAt: fakeOrderDate,
      });
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { quantity: { decrement: 2 } },
      });
      expect(prisma.inventoryLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          productId: 'prod-1',
          userId: 'tenant-1',
          change: 2,
          type: 'VENDA_CATALOGO',
        }),
      });
      expect(prisma.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'tenant-1',
          customerName: 'Cliente Teste',
          customerPhone: '11999998888',
          status: OrderStatus.AGUARDANDO_PAGAMENTO,
          total: 100,
        }),
        include: { items: true },
      });
    });
  });
});
