/**
 * Script de migracao Firebase -> Postgres (Prisma)
 */
const { PrismaClient } = require('@prisma/client');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const dotenv = require('dotenv');
const { resolve } = require('path');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

// Inicializa o Firebase
const serviceAccountPath = resolve(__dirname, '../serviceAccountKey.json');
let db;
try {
  const serviceAccount = require(serviceAccountPath);
  initializeApp({
    credential: cert(serviceAccount)
  });
  console.log('Firebase initialized successfully.');
  db = getFirestore();
} catch (e) {
  console.log('Aviso: Falha ao inicializar o Firebase:', e.message);
}

const prisma = new PrismaClient();

async function migrateData() {
  console.log('Iniciando script de migração completo...');

  try {
    if (!db) {
       console.log('O Firebase não foi inicializado. Interrompendo rascunho de migração.');
       return;
    }

    // --- 1. Migração do Usuário Base ---
    console.log('\n--- 1. Migrando Config / Usuario Raiz ---');
    // Para efeito deste teste, vamos criar um usuário central (tenant) para amarrar os dados órfãos,
    // pois a base do Firestore do HivePratas usa coleções de root muitas vezes amarradas ao app, nao a um user doc específico.
    // Buscaremos se existe algum doc em `users`, senão criamos um owner de sistema generico.
    let ownerId;
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('Nenhum usuário root encontrado. Criando owner de sistema...');
      const sysUser = await prisma.user.upsert({
        where: { email: 'admin@hivepratas.com.br' },
        update: {},
        create: {
          id: uuidv4(),
          email: 'admin@hivepratas.com.br',
          name: 'Hive Admin',
          role: 'OWNER',
        }
      });
      ownerId = sysUser.id;
    } else {
      const firstUser = usersSnapshot.docs[0];
      const userData = firstUser.data();
      const sysUser = await prisma.user.upsert({
        where: { email: userData.email || 'admin@hivepratas.com.br' },
        update: {},
        create: {
          id: uuidv4(),
          email: userData.email || 'admin@hivepratas.com.br',
          name: userData.name || userData.firstName || 'Hive Admin',
          role: 'OWNER',
          legacyId: firstUser.id
        }
      });
      ownerId = sysUser.id;
    }

    console.log(`Usuario Central Definido: ${ownerId}`);

    // --- 2. Migração das Categorias ---
    console.log('\n--- 2. Migrando Categorias ---');
    const categoriesSnapshot = await db.collection('categories').get();
    let catCount = 0;
    
    for (const doc of categoriesSnapshot.docs) {
      const data = doc.data();
      await prisma.category.upsert({
        where: { legacyId: doc.id },
        update: {
          name: data.name || 'Sem Nome'
        },
        create: {
          id: uuidv4(),
          userId: ownerId,
          name: data.name || 'Sem Nome',
          legacyId: doc.id
        }
      });
      catCount++;
    }
    console.log(`${catCount} categorias importadas.`);

    // --- 3. Migração de Produtos ---
    console.log('\n--- 3. Migrando Produtos ---');
    const productsSnapshot = await db.collection('products').get();
    let prodCount = 0;
    
    // Precisamos buscar as categorias p/ linkar IDs 
    const categoriasSalvas = await prisma.category.findMany();
    const mapCategorias = categoriasSalvas.reduce((acc, curr) => {
      if (curr.legacyId) acc[curr.name] = curr.id; // muitas vezes o Firebase salva pelo nome da cat, nao pelo ID
      return acc;
    }, {});

    for (const doc of productsSnapshot.docs) {
      const data = doc.data();
      
      const categoryId = mapCategorias[data.category] || null;

      const p = await prisma.product.upsert({
        where: { legacyId: doc.id },
        update: {
          name: data.name || 'Sem Nome',
          code: data.code || null,
          description: data.description || null,
          imageUrl: data.imageUrl || null,
          costPrice: data.costPrice || 0,
          salePrice: data.salePrice || 0,
          marginPercent: data.markup || data.marginPercent || 0,
          quantity: data.quantity || 0,
          weight: data.weight || 0,
          status: data.status === 'ativo' ? 'ATIVO' : 'INATIVO',
          categoryId: categoryId
        },
        create: {
          id: uuidv4(),
          userId: ownerId,
          name: data.name || 'Sem Nome',
          code: data.code || null,
          description: data.description || null,
          imageUrl: data.imageUrl || null,
          costPrice: data.costPrice || 0,
          salePrice: data.salePrice || 0,
          marginPercent: data.markup || data.marginPercent || 0,
          quantity: data.quantity || 0,
          weight: data.weight || 0,
          status: data.status === 'ativo' ? 'ATIVO' : 'INATIVO',
          categoryId: categoryId,
          legacyId: doc.id
        }
      });
      prodCount++;
    }
    console.log(`${prodCount} produtos importados.`);

    console.log('\nMigração ETL concluída com sucesso!');
  } catch (error) {
    console.error('Erro geral no fluxo de ETL:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateData();
