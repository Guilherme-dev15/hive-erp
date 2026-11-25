import { ConflictException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  PreviewMigrationBatchDto,
  PreviewMigrationProductStatus,
} from './dto/preview-migration.dto';

@Injectable()
export class PreviewMigrationService {
  constructor(private readonly prisma: PrismaService) {}

  async importBatch(batch: PreviewMigrationBatchDto) {
    const categoryKeys = new Set<string>();
    const productKeys = new Set<string>();
    for (const category of batch.categories) {
      if (categoryKeys.has(category.legacyId)) throw new ConflictException('Categoria duplicada no lote');
      categoryKeys.add(category.legacyId);
    }
    for (const product of batch.products) {
      if (productKeys.has(product.legacyId)) throw new ConflictException('Produto duplicado no lote');
      productKeys.add(product.legacyId);
    }

    return this.prisma.$transaction(async (tx) => {
      const ownerEmail = process.env.PREVIEW_MIGRATION_OWNER_EMAIL;
      const ownerName = process.env.PREVIEW_MIGRATION_OWNER_NAME || batch.config.storeName;
      if (!ownerEmail) throw new UnprocessableEntityException('Tenant temporário não configurado');

      const user = await tx.user.upsert({
        where: { email: ownerEmail },
        update: { name: ownerName, active: true, role: 'OWNER' },
        create: { email: ownerEmail, name: ownerName, active: true, role: 'OWNER' },
      });

      const existingSlug = await tx.config.findFirst({
        where: { publicSlug: batch.config.slug, NOT: { userId: user.id } },
        select: { userId: true },
      });
      if (existingSlug) throw new ConflictException('Slug já está em uso por outro tenant');

      await tx.config.upsert({
        where: { userId: user.id },
        update: { storeName: batch.config.storeName, publicSlug: batch.config.slug },
        create: { userId: user.id, storeName: batch.config.storeName, publicSlug: batch.config.slug },
      });

      const categories = new Map<string, string>();
      for (const input of batch.categories) {
        const existing = await tx.category.findUnique({ where: { legacyId: input.legacyId } });
        if (existing && existing.userId !== user.id) throw new ConflictException('Categoria pertence a outro tenant');
        const category = existing
          ? await tx.category.update({ where: { id: existing.id }, data: { name: input.name } })
          : await tx.category.create({ data: { legacyId: input.legacyId, userId: user.id, name: input.name } });
        categories.set(input.legacyId, category.id);
      }

      let created = 0;
      let updated = 0;
      for (const input of batch.products) {
        const categoryId = input.categoryLegacyId
          ? categories.get(input.categoryLegacyId) ?? (await tx.category.findUnique({ where: { legacyId: input.categoryLegacyId } }))?.id
          : null;
        if (input.categoryLegacyId && !categoryId) throw new UnprocessableEntityException('Categoria do produto não encontrada');
        if (categoryId) {
          const category = await tx.category.findUnique({ where: { id: categoryId }, select: { userId: true } });
          if (!category || category.userId !== user.id) throw new ConflictException('Categoria pertence a outro tenant');
        }
        const existing = await tx.product.findUnique({ where: { legacyId: input.legacyId } });
        if (existing && existing.userId !== user.id) throw new ConflictException('Produto pertence a outro tenant');
        const data = {
          name: input.name,
          code: input.code ?? null,
          categoryId,
          subcategory: input.subcategory ?? null,
          description: input.description ?? null,
          imageUrl: input.imageUrl ?? null,
          salePrice: input.salePrice,
          costPrice: input.costPrice ?? 0,
          quantity: input.quantity,
          status: input.status as ProductStatus,
        } satisfies Prisma.ProductUncheckedUpdateInput;
        if (existing) {
          await tx.product.update({ where: { id: existing.id }, data });
          updated += 1;
        } else {
          await tx.product.create({ data: { ...data, userId: user.id, legacyId: input.legacyId } });
          created += 1;
        }
      }
      return { operationId: batch.operationId, batchId: batch.batchId, status: 'completed', categories: categories.size, created, updated };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}
