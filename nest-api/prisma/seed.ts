import { PrismaClient } from '@prisma/client';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { parseMigrationOptions } from './migration-preflight';
import { dateValue, finiteNumber, orderStatus, requiredText, transactionType } from './migration-mappers';

const migrationOptions = parseMigrationOptions();

if (migrationOptions.dryRun) {
  console.log('Migration preflight passed; dry-run requested, no data will be written.');
  process.exit(0);
}

initializeApp({
  credential: cert(migrationOptions.credentials),
});

const prisma = new PrismaClient();
const db = getFirestore();
let migrationFailures = 0;

function recordMigrationFailure(message: string): void {
  migrationFailures += 1;
  console.error(`\n❌ Migration record failed: ${message}`);
}

async function getUserId(legacyId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { legacyId } });
  return user?.id || null;
}

async function migrateUsers() {
  console.log('\n🔄 Migrating Users...');
  const usersSnap = await db.collection('users').get();

  for (const doc of usersSnap.docs) {
    const data = doc.data();
    try {
      await prisma.user.upsert({
        where: { legacyId: doc.id },
        update: {
          name: data.name || 'User Migration',
          active: data.active !== false,
          role: data.role === 'SELLER' ? 'SELLER' : 'OWNER',
        },
        create: {
          legacyId: doc.id,
          email: data.email || `${doc.id}@migrated.com`,
          name: data.name || 'User Migration',
          active: data.active !== false,
          role: data.role === 'SELLER' ? 'SELLER' : 'OWNER',
          createdAt: dateValue(data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt, 'createdAt'),
        }
      });
      process.stdout.write('.');
    } catch (e: any) {
      recordMigrationFailure(e instanceof Error ? e.message : 'unknown error');
    }
  }
  console.log('\n✅ Users migration complete.');
}

async function migrateCategories() {
  console.log('\n🔄 Migrating Categories...');
  const snap = await db.collection('categories').get();

  for (const doc of snap.docs) {
    const data = doc.data();
    if (!data.userId) continue;

    const userId = await getUserId(data.userId);
    if (!userId) continue;

    try {
      await prisma.category.upsert({
        where: { legacyId: doc.id },
        update: { name: requiredText(data.name, 'name') },
        create: {
          legacyId: doc.id,
          userId,
          name: requiredText(data.name, 'name'),
          createdAt: dateValue(data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt, 'createdAt'),
        }
      });
      process.stdout.write('.');
    } catch (e: any) {
      recordMigrationFailure(e instanceof Error ? e.message : 'unknown error');
    }
  }
  console.log('\n✅ Categories migration complete.');
}

async function migrateSuppliers() {
  console.log('\n🔄 Migrating Suppliers...');
  const snap = await db.collection('suppliers').get();

  for (const doc of snap.docs) {
    const data = doc.data();
    if (!data.userId) continue;

    const userId = await getUserId(data.userId);
    if (!userId) continue;

    try {
      await prisma.supplier.upsert({
        where: { legacyId: doc.id },
        update: {
          name: requiredText(data.name, 'name'),
          contactPhone: data.contactPhone || null,
          email: data.email || null,
        },
        create: {
          legacyId: doc.id,
          userId,
          name: requiredText(data.name, 'name'),
          contactPhone: data.contactPhone || null,
          email: data.email || null,
          createdAt: dateValue(data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt, 'createdAt'),
        }
      });
      process.stdout.write('.');
    } catch (e: any) {
      recordMigrationFailure(e instanceof Error ? e.message : 'unknown error');
    }
  }
  console.log('\n✅ Suppliers migration complete.');
}

async function migrateProducts() {
  console.log('\n🔄 Migrating Products...');
  const snap = await db.collection('products').get();

  for (const doc of snap.docs) {
    const data = doc.data();
    if (!data.userId) continue;

    const userId = await getUserId(data.userId);
    if (!userId) continue;

    let categoryId = null;
    if (data.categoryId) {
      const cat = await prisma.category.findUnique({ where: { legacyId: data.categoryId } });
      categoryId = cat?.id || null;
    }

    let supplierId = null;
    if (data.supplierId) {
      const sup = await prisma.supplier.findUnique({ where: { legacyId: data.supplierId } });
      supplierId = sup?.id || null;
    }

    try {
      await prisma.product.upsert({
        where: { legacyId: doc.id },
        update: {
          name: requiredText(data.name, 'name'),
          salePrice: finiteNumber(data.salePrice, 'salePrice'),
          costPrice: finiteNumber(data.costPrice, 'costPrice'),
          quantity: finiteNumber(data.quantity, 'quantity'),
          status: data.status === 'INATIVO' ? 'INATIVO' : 'ATIVO',
          categoryId,
          supplierId,
        },
        create: {
          legacyId: doc.id,
          userId,
          name: requiredText(data.name, 'name'),
          salePrice: finiteNumber(data.salePrice, 'salePrice'),
          costPrice: finiteNumber(data.costPrice, 'costPrice'),
          quantity: finiteNumber(data.quantity, 'quantity'),
          status: data.status === 'INATIVO' ? 'INATIVO' : 'ATIVO',
          categoryId,
          supplierId,
          imageUrl: data.imageUrl || null,
          createdAt: dateValue(data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt, 'createdAt'),
        }
      });
      process.stdout.write('.');
    } catch (e: any) {
      recordMigrationFailure(e instanceof Error ? e.message : 'unknown error');
    }
  }
  console.log('\n✅ Products migration complete.');
}

async function migrateOrders() {
  console.log('\n🔄 Migrating Orders...');
  const snap = await db.collection('orders').get();

  for (const doc of snap.docs) {
    const data = doc.data();
    if (!data.userId) continue;

    const userId = await getUserId(data.userId);
    if (!userId) continue;

    try {
      await prisma.$transaction(async (tx) => {
        const order = await tx.order.upsert({
          where: { legacyId: doc.id },
          update: {
            customerName: requiredText(data.customerName, 'customerName'),
            customerPhone: data.customerPhone || null,
            status: orderStatus(data.status || 'CONCLUIDO'),
            subtotal: finiteNumber(data.subtotal, 'subtotal'),
            discount: finiteNumber(data.discount, 'discount'),
            total: finiteNumber(data.total, 'total'),
            notes: data.notes || null,
          },
          create: {
            legacyId: doc.id,
            userId,
            customerName: requiredText(data.customerName, 'customerName'),
            customerPhone: data.customerPhone || null,
            status: orderStatus(data.status || 'CONCLUIDO'),
            subtotal: finiteNumber(data.subtotal, 'subtotal'),
            discount: finiteNumber(data.discount, 'discount'),
            total: finiteNumber(data.total, 'total'),
            notes: data.notes || null,
            createdAt: dateValue(data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt, 'createdAt'),
          },
        });

        if (data.items && Array.isArray(data.items)) {
          await tx.orderItem.deleteMany({ where: { orderId: order.id } });
          const itemsToInsert = [];
          for (const item of data.items) {
            let productId = null;
            if (item.productId) {
              const prod = await tx.product.findUnique({ where: { legacyId: item.productId } });
              productId = prod?.id || null;
            }
            itemsToInsert.push({
              orderId: order.id,
              productId,
              name: requiredText(item.name || 'Produto Migrado', 'item.name'),
              code: item.code || null,
              salePrice: finiteNumber(item.salePrice, 'item.salePrice'),
              quantity: finiteNumber(item.quantity, 'item.quantity', 1),
              imageUrl: item.imageUrl || null,
            });
          }
          if (itemsToInsert.length > 0) {
            await tx.orderItem.createMany({ data: itemsToInsert });
          }
        }
      });
      process.stdout.write('.');
    } catch (e: any) {
      recordMigrationFailure(e instanceof Error ? e.message : 'unknown error');
    }
  }
  console.log('\n✅ Orders migration complete.');
}

async function migrateTransactions() {
  console.log('\n🔄 Migrating Transactions...');
  const snap = await db.collection('transactions').get();

  for (const doc of snap.docs) {
    const data = doc.data();
    if (!data.userId) continue;

    const userId = await getUserId(data.userId);
    if (!userId) continue;

    try {
      let orderId = null;
      if (data.orderId) {
        const order = await prisma.order.findUnique({ where: { legacyId: data.orderId } });
        orderId = order?.id || null;
      }

      await prisma.transaction.upsert({
        where: { legacyId: doc.id },
        update: {
          type: transactionType(data.type || 'VENDA'),
          amount: finiteNumber(data.amount, 'amount'),
          description: requiredText(data.description || 'Transação Migrada', 'description'),
          category: data.category || null,
          orderId,
        },
        create: {
          legacyId: doc.id,
          userId,
          type: transactionType(data.type || 'VENDA'),
          amount: finiteNumber(data.amount, 'amount'),
          description: requiredText(data.description || 'Transação Migrada', 'description'),
          category: data.category || null,
          date: dateValue(data.date?.toDate ? data.date.toDate() : data.date, 'date') || new Date(),
          orderId,
          createdAt: dateValue(data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt, 'createdAt'),
        }
      });
      process.stdout.write('.');
    } catch (e: any) {
      recordMigrationFailure(e instanceof Error ? e.message : 'unknown error');
    }
  }
  console.log('\n✅ Transactions migration complete.');
}

async function main() {
  console.log('🚀 Starting ETL Migration: Firestore -> Postgres...');

  await migrateUsers();
  await migrateCategories();
  await migrateSuppliers();
  await migrateProducts();
  await migrateOrders();
  await migrateTransactions();

  if (migrationFailures > 0) {
    throw new Error(`Migration finished with ${migrationFailures} failed record(s).`);
  }

  console.log('\n🎉 ETL Migration Finished!');
}

main()
  .catch((e) => {
    console.error('\nFatal Migration Error:', e instanceof Error ? e.message : 'unknown error');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
