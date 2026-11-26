import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductStatus, OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PublicCatalogService } from './public-catalog.service';
import { MercadoPagoService } from '../payments/mercado-pago.service';

describe('PublicCatalogService', () => {
  let service: PublicCatalogService;
  let prisma: {
    config: { findFirst: jest.Mock };
    product: { findMany: jest.Mock; findFirst: jest.Mock; update: jest.Mock; updateMany: jest.Mock };
    category: { findMany: jest.Mock };
    order: { create: jest.Mock; update: jest.Mock };
    inventoryLog: { create: jest.Mock };
    $transaction: jest.Mock;
  };
  let mercadoPagoService: {
    createCheckoutPreference: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      config: { findFirst: jest.fn() },
      product: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      category: { findMany: jest.fn() },
      order: { create: jest.fn(), update: jest.fn() },
      inventoryLog: { create: jest.fn() },
      $transaction: jest.fn().mockImplementation((cb) => cb(prisma)),
    };
    mercadoPagoService = {
      createCheckoutPreference: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicCatalogService,
        { provide: PrismaService, useValue: prisma },
        { provide: MercadoPagoService, useValue: mercadoPagoService },
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

  it('resolves the tenant server-side and scopes every catalog query without exposing secrets', async () => {
    prisma.config.findFirst.mockResolvedValue({
      userId: 'tenant-a',
      storeName: 'Hive',
      publicSlug: 'hive',
      primaryColor: '#D4AF37',
      secondaryColor: '#343434',
      whatsappNumber: null,
      banners: [],
      lowStockThreshold: 5,
      checkoutMode: 'WHATSAPP',
      hasGatewayAddon: false,
      gatewayProvider: null,
      gatewayPublicKey: null,
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
      data: { config: { slug: 'hive', checkoutMode: 'WHATSAPP' }, produtos: [{ id: 'product-a' }] },
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
        checkoutMode: true,
        hasGatewayAddon: true,
        gatewayProvider: true,
        gatewayPublicKey: true,
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

    it('rejects order creation if item has no productId', async () => {
      prisma.config.findFirst.mockResolvedValue({
        userId: 'tenant-1',
        publicSlug: 'hive',
      });

      await expect(
        service.createOrder({
          ...validDto,
          items: [{ name: 'Item avulso', salePrice: 1, quantity: 1 } as any],
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.order.create).not.toHaveBeenCalled();
    });

    it('rejects order if product does not exist or has insufficient stock atomically', async () => {
      prisma.config.findFirst.mockResolvedValue({
        userId: 'tenant-1',
        publicSlug: 'hive',
      });
      prisma.product.findFirst.mockResolvedValue({
        id: 'prod-1',
        name: 'Colar de Prata',
        salePrice: 100,
        quantity: 1,
        status: ProductStatus.ATIVO,
        variants: [],
      });
      prisma.product.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.createOrder(validDto)).rejects.toThrow(/Estoque insuficiente/);
      expect(prisma.order.create).not.toHaveBeenCalled();
    });

    it('ignores tampered client prices/discounts and calculates authoritative DB total', async () => {
      prisma.config.findFirst.mockResolvedValue({
        userId: 'tenant-1',
        storeName: 'Hive',
        publicSlug: 'hive',
        checkoutMode: 'WHATSAPP',
        hasGatewayAddon: false,
      });
      prisma.product.findFirst.mockResolvedValue({
        id: 'prod-1',
        name: 'Colar de Prata',
        code: 'COL-1',
        salePrice: 150,
        imageUrl: null,
        quantity: 10,
        status: ProductStatus.ATIVO,
        variants: [],
      });
      prisma.product.updateMany.mockResolvedValue({ count: 1 });
      const fakeOrderDate = new Date();
      prisma.order.create.mockImplementation(async ({ data }) => ({
        id: 'order-123',
        status: OrderStatus.AGUARDANDO_PAGAMENTO,
        total: data.total,
        createdAt: fakeOrderDate,
      }));

      const tamperedDto = {
        ...validDto,
        subtotal: 0.01,
        discount: 999,
        total: 0.01,
        items: [
          {
            productId: 'prod-1',
            name: 'Nome Adulterado',
            salePrice: 0.01,
            quantity: 2,
          },
        ],
      };

      const res = await service.createOrder(tamperedDto);

      expect(res).toEqual({
        success: true,
        orderId: 'order-123',
        status: OrderStatus.AGUARDANDO_PAGAMENTO,
        total: 300,
        createdAt: fakeOrderDate,
      });
      expect(prisma.product.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'prod-1',
          userId: 'tenant-1',
          status: ProductStatus.ATIVO,
          quantity: { gte: 2 },
        },
        data: { quantity: { decrement: 2 } },
      });
      expect(prisma.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'tenant-1',
          subtotal: 300,
          discount: 0,
          total: 300,
          items: {
            create: [
              expect.objectContaining({
                productId: 'prod-1',
                name: 'Colar de Prata',
                salePrice: 150,
                quantity: 2,
              }),
            ],
          },
        }),
        include: { items: true },
      });
    });

    it('creates Mercado Pago Checkout Pro preference when paymentMethod is GATEWAY and merchant is configured', async () => {
      prisma.config.findFirst.mockResolvedValue({
        userId: 'tenant-1',
        storeName: 'Hive Pratas',
        publicSlug: 'hive',
        checkoutMode: 'GATEWAY',
        hasGatewayAddon: true,
        gatewayAccessToken: 'v1:encrypted-token',
      });
      prisma.product.findFirst.mockResolvedValue({
        id: 'prod-1',
        name: 'Anel Prata',
        code: 'AN-1',
        salePrice: 120,
        imageUrl: null,
        quantity: 5,
        status: ProductStatus.ATIVO,
        variants: [{ id: 'var-1', adjustmentValue: 140 }],
      });
      prisma.product.updateMany.mockResolvedValue({ count: 1 });
      const fakeOrderDate = new Date();
      prisma.order.create.mockImplementation(async ({ data }) => ({
        id: 'ord-gw-1',
        status: OrderStatus.AGUARDANDO_PAGAMENTO,
        total: data.total,
        createdAt: fakeOrderDate,
      }));
      mercadoPagoService.createCheckoutPreference.mockResolvedValue({
        preferenceId: 'pref-123',
        paymentUrl: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-123',
      });

      const res = await service.createOrder(
        {
          slug: 'hive',
          customerName: 'Maria',
          customerPhone: '11988887777',
          paymentMethod: 'GATEWAY',
          items: [{ productId: 'prod-1', variantId: 'var-1', quantity: 2 }],
        },
        'https://hive.hiveerp.com.br',
      );

      expect(res.total).toBe(280);
      expect(res.preferenceId).toBe('pref-123');
      expect(res.paymentUrl).toBe('https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-123');
      expect(mercadoPagoService.createCheckoutPreference).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'ord-gw-1',
          slug: 'hive',
          returnBaseUrl: 'https://hive.hiveerp.com.br',
          items: [expect.objectContaining({ id: 'prod-1', quantity: 2, unitPrice: 140 })],
        }),
      );
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'ord-gw-1' },
        data: {
          gatewayOrderId: 'pref-123',
          gatewayPaymentUrl: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-123',
          gatewayStatus: 'PENDING',
        },
      });
    });

    it('rolls back order and restores stock if Mercado Pago preference creation fails', async () => {
      prisma.config.findFirst.mockResolvedValue({
        userId: 'tenant-1',
        storeName: 'Hive Pratas',
        publicSlug: 'hive',
        checkoutMode: 'GATEWAY',
        hasGatewayAddon: true,
        gatewayAccessToken: 'v1:encrypted-token',
      });
      prisma.product.findFirst.mockResolvedValue({
        id: 'prod-1',
        name: 'Anel Prata',
        code: 'AN-1',
        salePrice: 120,
        imageUrl: null,
        quantity: 5,
        status: ProductStatus.ATIVO,
        variants: [],
      });
      prisma.product.updateMany.mockResolvedValue({ count: 1 });
      prisma.product.update.mockResolvedValue({ id: 'prod-1', quantity: 5 });
      prisma.order.create.mockResolvedValue({
        id: 'ord-fail-1',
        status: OrderStatus.AGUARDANDO_PAGAMENTO,
        total: 120,
        createdAt: new Date(),
      });
      mercadoPagoService.createCheckoutPreference.mockRejectedValue(
        new BadRequestException('Falha MP'),
      );

      await expect(
        service.createOrder({
          slug: 'hive',
          customerName: 'Maria',
          customerPhone: '11988887777',
          paymentMethod: 'GATEWAY',
          items: [{ productId: 'prod-1', quantity: 1 }],
        }),
      ).rejects.toThrow('Falha MP');

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'ord-fail-1' },
        data: { status: OrderStatus.CANCELADO, gatewayStatus: 'FAILED' },
      });
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { quantity: { increment: 1 } },
      });
    });
  });
});
