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
};
const TENANT_B = {
  email: `${FIXTURE_PREFIX}-b@example.invalid`,
  legacyId: `${FIXTURE_PREFIX}-user-b`,
  name: 'M7.3 Tenant B',
  slug: 'm73-tenant-b',
  categoryLegacyId: `${FIXTURE_PREFIX}-category-b`,
  productLegacyId: `${FIXTURE_PREFIX}-product-b`,
};
const FIXTURE_TENANTS = [TENANT_A, TENANT_B] as const;

@Injectable()
export class PreviewFixtureService {
  constructor(private readonly prisma: PrismaService) {}

  async run(action: PreviewFixtureAction) {
    return action === 'seed' ? this.seed() : this.cleanup();
  }

  private async seed() {
    return this.prisma.$transaction(async (tx) => {
      let categories = 0;
      let products = 0;

      for (const tenant of FIXTURE_TENANTS) {
        const existingUser = await tx.user.findUnique({ where: { email: tenant.email } });
        if (existingUser && existingUser.legacyId !== tenant.legacyId) {
          throw new ConflictException('Fixture reservada já contém dados desconhecidos');
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
        if (existingCategory && existingCategory.userId !== user.id) {
          throw new ConflictException('Fixture reservada contém categoria de outro tenant');
        }
        const category = existingCategory
          ? await tx.category.update({ where: { id: existingCategory.id }, data: { name: 'M7.3 Sintéticos' } })
          : await tx.category.create({ data: { userId: user.id, legacyId: tenant.categoryLegacyId, name: 'M7.3 Sintéticos' } });
        categories += 1;

        const existingProduct = await tx.product.findUnique({ where: { legacyId: tenant.productLegacyId } });
        if (existingProduct && existingProduct.userId !== user.id) {
          throw new ConflictException('Fixture reservada contém produto de outro tenant');
        }
        const productData = {
          userId: user.id,
          categoryId: category.id,
          name: `Produto ${tenant.name}`,
          code: tenant.productLegacyId,
          description: 'Fixture sintética M7.3',
          salePrice: 10,
          costPrice: 2,
          quantity: 5,
          status: ProductStatus.ATIVO,
        } satisfies Prisma.ProductUncheckedUpdateInput;
        if (existingProduct) {
          await tx.product.update({ where: { id: existingProduct.id }, data: productData });
        } else {
          await tx.product.create({ data: { ...productData, legacyId: tenant.productLegacyId } });
        }
        products += 1;
      }

      return { fixture: PREVIEW_FIXTURE_NAME, action: 'seed', tenants: FIXTURE_TENANTS.length, categories, products };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  private async cleanup() {
    return this.prisma.$transaction(async (tx) => {
      const users = await tx.user.findMany({
        where: {
          OR: FIXTURE_TENANTS.map((tenant) => ({ email: tenant.email, legacyId: tenant.legacyId })),
        },
        select: { id: true },
      });
      const userIds = users.map((user) => user.id);
      if (userIds.length === 0) {
        return { fixture: PREVIEW_FIXTURE_NAME, action: 'cleanup', tenants: 0, categories: 0, products: 0 };
      }

      const productIds = (await tx.product.findMany({
        where: { legacyId: { in: FIXTURE_TENANTS.map((tenant) => tenant.productLegacyId) }, userId: { in: userIds } },
        select: { id: true },
      })).map((product) => product.id);
      if (productIds.length > 0) {
        await tx.productVariant.deleteMany({ where: { productId: { in: productIds } } });
        await tx.product.deleteMany({ where: { id: { in: productIds } } });
      }

      const deletedCategories = await tx.category.deleteMany({
        where: { legacyId: { in: FIXTURE_TENANTS.map((tenant) => tenant.categoryLegacyId) }, userId: { in: userIds } },
      });
      await tx.config.deleteMany({ where: { userId: { in: userIds }, publicSlug: { in: FIXTURE_TENANTS.map((tenant) => tenant.slug) } } });
      await tx.user.deleteMany({ where: { id: { in: userIds } } });

      return { fixture: PREVIEW_FIXTURE_NAME, action: 'cleanup', tenants: users.length, categories: deletedCategories.count, products: productIds.length };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}
