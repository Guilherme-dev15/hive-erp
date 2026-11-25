import { ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PreviewFixtureService } from './preview-fixture.service';

const FIXTURE_PREFIX = 'm73-fixture-tenant-isolation-v1';
const TENANT_A = {
  id: 'tenant-a-id',
  email: `${FIXTURE_PREFIX}-a@example.invalid`,
  legacyId: `${FIXTURE_PREFIX}-user-a`,
  name: 'M7.3 Tenant A',
  role: 'OWNER',
  active: true,
};
const CATEGORY_A = {
  id: 'category-a-id',
  legacyId: `${FIXTURE_PREFIX}-category-a`,
  name: 'M7.3 Sintéticos',
};
const PRODUCT_A = {
  id: 'product-a-id',
  legacyId: `${FIXTURE_PREFIX}-product-a`,
  userId: TENANT_A.id,
  categoryId: CATEGORY_A.id,
  name: 'Produto M7.3 Tenant A',
  code: `${FIXTURE_PREFIX}-product-a`,
  description: 'Fixture sintética M7.3',
  salePrice: 10,
  costPrice: 2,
  quantity: 5,
  status: 'ATIVO',
};

function createHarness() {
  const tx = {
    user: {
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    config: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn(),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    category: {
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    product: {
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    supplier: { findMany: jest.fn().mockResolvedValue([]) },
    coupon: { findMany: jest.fn().mockResolvedValue([]) },
    order: { findMany: jest.fn().mockResolvedValue([]) },
    transaction: { findMany: jest.fn().mockResolvedValue([]) },
    inventoryLog: { findMany: jest.fn().mockResolvedValue([]) },
    dashboardStat: { findMany: jest.fn().mockResolvedValue([]) },
    productVariant: { findMany: jest.fn().mockResolvedValue([]) },
    orderItem: { findMany: jest.fn().mockResolvedValue([]) },
  };
  const prisma = {
    $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) => callback(tx)),
  } as unknown as PrismaService;

  return { service: new PreviewFixtureService(prisma), prisma, tx };
}

describe('PreviewFixtureService', () => {
  it('returns an empty cleanup when no fixture records exist', async () => {
    const { service, tx } = createHarness();

    await expect(service.run('cleanup')).resolves.toMatchObject({
      action: 'cleanup',
      tenants: 0,
      categories: 0,
      products: 0,
    });
    expect(tx.user.delete).not.toHaveBeenCalled();
    expect(tx.product.deleteMany).not.toHaveBeenCalled();
    expect(tx.category.deleteMany).not.toHaveBeenCalled();
  });

  it('aborts cleanup when a reserved email is paired with an unexpected legacy id', async () => {
    const { service, tx } = createHarness();
    tx.user.findMany.mockResolvedValue([{ ...TENANT_A, legacyId: 'unrelated-user-id' }]);

    await expect(service.run('cleanup')).rejects.toThrow(ConflictException);
    expect(tx.user.delete).not.toHaveBeenCalled();
    expect(tx.config.deleteMany).not.toHaveBeenCalled();
  });

  it('aborts cleanup rather than deleting a user with non-fixture products', async () => {
    const { service, tx } = createHarness();
    tx.user.findMany.mockResolvedValue([TENANT_A]);
    tx.product.findMany.mockResolvedValue([{ ...PRODUCT_A, legacyId: null }]);

    await expect(service.run('cleanup')).rejects.toThrow(ConflictException);
    expect(tx.product.deleteMany).not.toHaveBeenCalled();
    expect(tx.category.deleteMany).not.toHaveBeenCalled();
    expect(tx.user.delete).not.toHaveBeenCalled();
  });

  it('deletes only the exact synthetic records after validating their ownership and associations', async () => {
    const { service, tx } = createHarness();
    tx.user.findMany.mockResolvedValue([TENANT_A]);
    tx.category.findMany.mockResolvedValue([CATEGORY_A]);
    tx.product.findMany
      .mockResolvedValueOnce([PRODUCT_A])
      .mockResolvedValueOnce([{ id: PRODUCT_A.id, userId: TENANT_A.id, legacyId: PRODUCT_A.legacyId }]);
    tx.config.findUnique.mockResolvedValue({ storeName: TENANT_A.name, publicSlug: 'm73-tenant-a' });
    tx.product.deleteMany.mockResolvedValue({ count: 1 });
    tx.category.deleteMany.mockResolvedValue({ count: 1 });

    await expect(service.run('cleanup')).resolves.toMatchObject({
      action: 'cleanup',
      tenants: 1,
      categories: 1,
      products: 1,
    });
    expect(tx.product.deleteMany).toHaveBeenCalledWith({
      where: { id: PRODUCT_A.id, userId: TENANT_A.id, legacyId: PRODUCT_A.legacyId },
    });
    expect(tx.category.deleteMany).toHaveBeenCalledWith({
      where: { id: CATEGORY_A.id, userId: TENANT_A.id, legacyId: CATEGORY_A.legacyId },
    });
    expect(tx.config.deleteMany).toHaveBeenCalledWith({ where: { userId: TENANT_A.id, publicSlug: 'm73-tenant-a' } });
    expect(tx.user.delete).toHaveBeenCalledWith({ where: { id: TENANT_A.id } });
  });

  it('does not upsert a tenant when a reserved public slug belongs to another user', async () => {
    const { service, tx } = createHarness();
    tx.config.findUnique.mockResolvedValue({ userId: 'unrelated-user-id' });

    await expect(service.run('seed')).rejects.toThrow(ConflictException);
    expect(tx.user.upsert).not.toHaveBeenCalled();
    expect(tx.category.create).not.toHaveBeenCalled();
    expect(tx.product.create).not.toHaveBeenCalled();
  });
});
