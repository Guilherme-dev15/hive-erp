import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PREVIEW_FIXTURE_NAME, PreviewFixtureAction } from './preview-fixture.dto';

const FIXTURE_PREFIX = 'm73-fixture-tenant-isolation-v1';
const TENANT_A = {
  email: `${FIXTURE_PREFIX}-a@example.invalid`,
  legacyId: `${FIXTURE_PREFIX}-user-a`,
  name: 'M7.3 Tenant A',
  slug: 'm73-tenant-a',
  categoryLegacyId: `${FIXTURE_PREFIX}-category-a`,
  productLegacyId: `${FIXTURE_PREFIX}-product-a`,
} as const;
const TENANT_B = {
  email: `${FIXTURE_PREFIX}-b@example.invalid`,
  legacyId: `${FIXTURE_PREFIX}-user-b`,
  name: 'M7.3 Tenant B',
  slug: 'm73-tenant-b',
  categoryLegacyId: `${FIXTURE_PREFIX}-category-b`,
  productLegacyId: `${FIXTURE_PREFIX}-product-b`,
} as const;
const FIXTURE_TENANTS = [TENANT_A, TENANT_B] as const;

@Injectable()
export class PreviewFixtureService {
  constructor(private readonly prisma: PrismaService) {}

  async run(action: PreviewFixtureAction) {
    return action === 'seed' ? this.seed() : this.cleanup();
  }

  private async findFixtureUsers(tx: Prisma.TransactionClient) {
    const users = await tx.user.findMany({
      where: {
        OR: FIXTURE_TENANTS.flatMap(({ email, legacyId }) => [{ email }, { legacyId }]),
      },
      select: { id: true, email: true, legacyId: true, name: true, role: true, active: true },
    });
    const fixtureUsers = new Map<string, (typeof users)[number]>();

    for (const user of users) {
      const tenant = FIXTURE_TENANTS.find(({ email, legacyId }) => email === user.email || legacyId === user.legacyId);
      if (
        !tenant ||
        user.email !== tenant.email ||
        user.legacyId !== tenant.legacyId ||
        user.name !== tenant.name ||
        user.role !== 'OWNER' ||
        user.active !== true
      ) {
        throw new ConflictException('Fixture reservada contém usuário com identidade ou estado inesperado');
      }
      fixtureUsers.set(tenant.email, user);
    }

    return fixtureUsers;
  }

  private async assertUserHasOnlyFixtureData(
    tx: Prisma.TransactionClient,
    tenant: (typeof FIXTURE_TENANTS)[number],
    userId: string,
  ) {
    const [config, categories, products, suppliers, coupons, orders, transactions, inventoryLogs, dashboardStats] = await Promise.all([
      tx.config.findUnique({ where: { userId }, select: { storeName: true, publicSlug: true } }),
      tx.category.findMany({ where: { userId }, select: { id: true, legacyId: true, name: true } }),
      tx.product.findMany({ where: { userId }, select: { id: true, legacyId: true, categoryId: true } }),
      tx.supplier.findMany({ where: { userId }, select: { id: true } }),
      tx.coupon.findMany({ where: { userId }, select: { id: true } }),
      tx.order.findMany({ where: { userId }, select: { id: true } }),
      tx.transaction.findMany({ where: { userId }, select: { id: true } }),
      tx.inventoryLog.findMany({ where: { userId }, select: { id: true } }),
      tx.dashboardStat.findMany({ where: { userId }, select: { id: true } }),
    ]);

    if (config && (config.storeName !== tenant.name || config.publicSlug !== tenant.slug)) {
      throw new ConflictException('Fixture reservada contém configuração não reconhecida');
    }

    const category = categories.find(({ legacyId }) => legacyId === tenant.categoryLegacyId);
    if (
      categories.some(({ legacyId, name }) => legacyId !== tenant.categoryLegacyId || name !== 'M7.3 Sintéticos') ||
      products.some(({ legacyId }) => legacyId !== tenant.productLegacyId) ||
      suppliers.length > 0 || coupons.length > 0 || orders.length > 0 || transactions.length > 0 ||
      inventoryLogs.length > 0 || dashboardStats.length > 0
    ) {
      throw new ConflictException('Fixture reservada está associada a dados fora do escopo sintético');
    }

    const product = products[0];
    if (product && category && product.categoryId !== category.id) {
      throw new ConflictException('Fixture reservada contém produto associado a categoria inesperada');
    }

    if (category) {
      const categoryProducts = await tx.product.findMany({
        where: { categoryId: category.id },
        select: { id: true, userId: true, legacyId: true },
      });
      if (categoryProducts.some(({ userId: ownerId, legacyId }) => ownerId !== userId || legacyId !== tenant.productLegacyId)) {
        throw new ConflictException('Categoria da fixture está associada a produto fora do escopo sintético');
      }
    }

    if (product) {
      const productIds = [product.id];
      const [variants, orderItems, productTransactions, productInventoryLogs] = await Promise.all([
        tx.productVariant.findMany({ where: { productId: { in: productIds } }, select: { id: true } }),
        tx.orderItem.findMany({ where: { productId: { in: productIds } }, select: { id: true } }),
        tx.transaction.findMany({ where: { productId: { in: productIds } }, select: { id: true } }),
        tx.inventoryLog.findMany({ where: { productId: { in: productIds } }, select: { id: true } }),
      ]);
      if (variants.length > 0 || orderItems.length > 0 || productTransactions.length > 0 || productInventoryLogs.length > 0) {
        throw new ConflictException('Produto da fixture está associado a registros que não pertencem à fixture');
      }
    }

    return { category, product };
  }

  private async seed() {
    return this.prisma.$transaction(async (tx) => {
      const existingUsers = await this.findFixtureUsers(tx);
      let categories = 0;
      let products = 0;

      for (const tenant of FIXTURE_TENANTS) {
        const existingUser = existingUsers.get(tenant.email);
        if (existingUser) {
          await this.assertUserHasOnlyFixtureData(tx, tenant, existingUser.id);
        }

        const slugOwner = await tx.config.findUnique({ where: { publicSlug: tenant.slug }, select: { userId: true } });
        if (slugOwner && slugOwner.userId !== existingUser?.id) {
          throw new ConflictException('Slug da fixture já pertence a outro tenant');
        }

        const user = await tx.user.upsert({
          where: { email: tenant.email },
          update: { name: tenant.name, active: true, role: 'OWNER', legacyId: tenant.legacyId },
          create: { email: tenant.email, name: tenant.name, active: true, role: 'OWNER', legacyId: tenant.legacyId },
        });

        await tx.config.upsert({
          where: { userId: user.id },
          update: { storeName: tenant.name, publicSlug: tenant.slug },
          create: { userId: user.id, storeName: tenant.name, publicSlug: tenant.slug },
        });

        const existingCategory = await tx.category.findUnique({ where: { legacyId: tenant.categoryLegacyId } });
        if (existingCategory && (existingCategory.userId !== user.id || existingCategory.name !== 'M7.3 Sintéticos')) {
          throw new ConflictException('Fixture reservada contém categoria de outro tenant ou conteúdo inesperado');
        }
        const category = existingCategory ?? await tx.category.create({
          data: { userId: user.id, legacyId: tenant.categoryLegacyId, name: 'M7.3 Sintéticos' },
        });
        categories += 1;

        const existingProduct = await tx.product.findUnique({ where: { legacyId: tenant.productLegacyId } });
        if (
          existingProduct &&
          (existingProduct.userId !== user.id || existingProduct.categoryId !== category.id ||
            existingProduct.name !== `Produto ${tenant.name}` || existingProduct.code !== tenant.productLegacyId ||
            existingProduct.description !== 'Fixture sintética M7.3' || Number(existingProduct.salePrice) !== 10 ||
            Number(existingProduct.costPrice) !== 2 || existingProduct.quantity !== 5 || existingProduct.status !== ProductStatus.ATIVO)
        ) {
          throw new ConflictException('Fixture reservada contém produto de outro tenant ou conteúdo inesperado');
        }
        if (!existingProduct) {
          await tx.product.create({
            data: {
              userId: user.id,
              categoryId: category.id,
              name: `Produto ${tenant.name}`,
              code: tenant.productLegacyId,
              description: 'Fixture sintética M7.3',
              salePrice: 10,
              costPrice: 2,
              quantity: 5,
              status: ProductStatus.ATIVO,
              legacyId: tenant.productLegacyId,
            },
          });
        }
        products += 1;
      }

      return { fixture: PREVIEW_FIXTURE_NAME, action: 'seed', tenants: FIXTURE_TENANTS.length, categories, products };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  private async cleanup() {
    return this.prisma.$transaction(async (tx) => {
      const fixtureUsers = await this.findFixtureUsers(tx);
      if (fixtureUsers.size === 0) {
        const [categories, products] = await Promise.all([
          tx.category.findMany({ where: { legacyId: { in: FIXTURE_TENANTS.map(({ categoryLegacyId }) => categoryLegacyId) } }, select: { id: true } }),
          tx.product.findMany({ where: { legacyId: { in: FIXTURE_TENANTS.map(({ productLegacyId }) => productLegacyId) } }, select: { id: true } }),
        ]);
        if (categories.length > 0 || products.length > 0) {
          throw new ConflictException('Fixture reservada contém registros sem usuário proprietário reconhecido');
        }
        return { fixture: PREVIEW_FIXTURE_NAME, action: 'cleanup', tenants: 0, categories: 0, products: 0 };
      }

      const cleanupTargets: Array<{
        tenant: (typeof FIXTURE_TENANTS)[number];
        userId: string;
        categoryId?: string;
        productId?: string;
      }> = [];

      for (const tenant of FIXTURE_TENANTS) {
        const user = fixtureUsers.get(tenant.email);
        if (!user) continue;
        const { category, product } = await this.assertUserHasOnlyFixtureData(tx, tenant, user.id);
        cleanupTargets.push({ tenant, userId: user.id, categoryId: category?.id, productId: product?.id });
      }

      let deletedCategories = 0;
      let deletedProducts = 0;
      for (const target of cleanupTargets) {
        if (target.productId) {
          const deleted = await tx.product.deleteMany({
            where: { id: target.productId, userId: target.userId, legacyId: target.tenant.productLegacyId },
          });
          deletedProducts += deleted.count;
        }
        if (target.categoryId) {
          const deleted = await tx.category.deleteMany({
            where: { id: target.categoryId, userId: target.userId, legacyId: target.tenant.categoryLegacyId },
          });
          deletedCategories += deleted.count;
        }
        await tx.config.deleteMany({ where: { userId: target.userId, publicSlug: target.tenant.slug } });
        await tx.user.delete({ where: { id: target.userId } });
      }

      return {
        fixture: PREVIEW_FIXTURE_NAME,
        action: 'cleanup',
        tenants: cleanupTargets.length,
        categories: deletedCategories,
        products: deletedProducts,
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}
