import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PublicCatalogService } from './public-catalog.service';

describe('PublicCatalogService', () => {
  let service: PublicCatalogService;
  let prisma: {
    config: { findFirst: jest.Mock };
    product: { findMany: jest.Mock };
    category: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      config: { findFirst: jest.fn() },
      product: { findMany: jest.fn() },
      category: { findMany: jest.fn() },
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
});
