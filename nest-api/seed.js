const { PrismaClient } = require('@prisma/client');
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Ensure correct app initialization
if (admin.apps && admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else if (!admin.apps) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const prisma = new PrismaClient();
const db = admin.firestore();

async function getUserId(legacyId) {
  const user = await prisma.user.findUnique({ where: { legacyId } });
  return user ? user.id : null;
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
          createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : new Date(),
        }
      });
      process.stdout.write('.');
    } catch (e) {
      console.error(`\n❌ Failed to migrate user ${doc.id}: ${e.message}`);
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
        update: { name: data.name },
        create: {
          legacyId: doc.id,
          userId,
          name: data.name,
          createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : new Date(),
        }
      });
      process.stdout.write('.');
    } catch (e) {
      console.error(`\n❌ Failed to migrate category ${doc.id}: ${e.message}`);
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
          name: data.name,
          contactPhone: data.contactPhone || null,
          email: data.email || null,
        },
        create: {
          legacyId: doc.id,
          userId,
          name: data.name,
          contactPhone: data.contactPhone || null,
          email: data.email || null,
          createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : new Date(),
        }
      });
      process.stdout.write('.');
    } catch (e) {
      console.error(`\n❌ Failed to migrate supplier ${doc.id}: ${e.message}`);
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
      categoryId = cat ? cat.id : null;
    }

    let supplierId = null;
    if (data.supplierId) {
      const sup = await prisma.supplier.findUnique({ where: { legacyId: data.supplierId } });
      supplierId = sup ? sup.id : null;
    }

    try {
      await prisma.product.upsert({
        where: { legacyId: doc.id },
        update: {
          name: data.name,
          salePrice: Number(data.salePrice) || 0,
          costPrice: Number(data.costPrice) || 0,
          quantity: Number(data.quantity) || 0,
          status: data.status === 'INATIVO' ? 'INATIVO' : 'ATIVO',
          categoryId,
          supplierId,
        },
        create: {
          legacyId: doc.id,
          userId,
          name: data.name,
          salePrice: Number(data.salePrice) || 0,
          costPrice: Number(data.costPrice) || 0,
          quantity: Number(data.quantity) || 0,
          status: data.status === 'INATIVO' ? 'INATIVO' : 'ATIVO',
          categoryId,
          supplierId,
          imageUrl: data.imageUrl || null,
          createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : new Date(),
        }
      });
      process.stdout.write('.');
    } catch (e) {
      console.error(`\n❌ Failed to migrate product ${doc.id}: ${e.message}`);
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
      const order = await prisma.order.upsert({
        where: { legacyId: doc.id },
        update: {
          customerName: data.customerName || 'Cliente Migração',
          customerPhone: data.customerPhone || null,
          status: data.status || 'CONCLUIDO',
          subtotal: Number(data.subtotal) || 0,
          discount: Number(data.discount) || 0,
          total: Number(data.total) || 0,
          notes: data.notes || null,
        },
        create: {
          legacyId: doc.id,
          userId,
          customerName: data.customerName || 'Cliente Migração',
          customerPhone: data.customerPhone || null,
          status: data.status || 'CONCLUIDO',
          subtotal: Number(data.subtotal) || 0,
          discount: Number(data.discount) || 0,
          total: Number(data.total) || 0,
          notes: data.notes || null,
          createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : new Date(),
        }
      });

      if (data.items && Array.isArray(data.items)) {
         await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
         const itemsToInsert = [];
         for (const item of data.items) {
           let productId = null;
           if (item.productId) {
             const prod = await prisma.product.findUnique({ where: { legacyId: item.productId } });
             productId = prod ? prod.id : null;
           }
           itemsToInsert.push({
             orderId: order.id,
             productId,
             name: item.name || 'Produto Migrado',
             code: item.code || null,
             salePrice: Number(item.salePrice) || 0,
             quantity: Number(item.quantity) || 1,
             imageUrl: item.imageUrl || null,
           });
         }
         if (itemsToInsert.length > 0) {
           await prisma.orderItem.createMany({ data: itemsToInsert });
         }
      }
      process.stdout.write('.');
    } catch (e) {
      console.error(`\n❌ Failed to migrate order ${doc.id}: ${e.message}`);
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
        orderId = order ? order.id : null;
      }

      await prisma.transaction.upsert({
        where: { legacyId: doc.id },
        update: {
          type: data.type || 'VENDA',
          amount: Number(data.amount) || 0,
          description: data.description || 'Transação Migrada',
          category: data.category || null,
          orderId,
        },
        create: {
          legacyId: doc.id,
          userId,
          type: data.type || 'VENDA',
          amount: Number(data.amount) || 0,
          description: data.description || 'Transação Migrada',
          category: data.category || null,
          date: data.date && data.date.toDate ? data.date.toDate() : new Date(),
          orderId,
          createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : new Date(),
        }
      });
      process.stdout.write('.');
    } catch (e) {
      console.error(`\n❌ Failed to migrate transaction ${doc.id}: ${e.message}`);
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

  console.log('\n🎉 ETL Migration Finished!');
}

main()
  .catch((e) => {
    console.error('\nFatal Migration Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
