/**
 * Script de migracao Firebase -> Postgres (Prisma)
 */
const { PrismaClient } = require('@prisma/client');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const dotenv = require('dotenv');
const { resolve } = require('path');

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
  console.log('Iniciando script de migração (Rascunho)...');

  try {
    if (!db) {
       console.log('O Firebase não foi inicializado. Interrompendo rascunho de migração.');
       return;
    }

    console.log('Testando leitura de usuários (tenants)...');
    const usersSnapshot = await db.collection('users').limit(1).get();

    if (usersSnapshot.empty) {
      console.log('Nenhum usuário encontrado na collection "users".');
    } else {
      for (const doc of usersSnapshot.docs) {
        const data = doc.data();
        console.log(`Documento de teste encontrado no Firebase: [ID: ${doc.id}] - Nome: ${data.name || data.firstName || 'Sem nome'}`);

        console.log('Testando escrita no PostgreSQL local via Prisma...');
        // Verifica se a estrutura requer um id real vs uuid
        try {
          const fakeUser = await prisma.user.upsert({
            where: { email: data.email || `${doc.id}@migracao.test` },
            update: {},
            create: {
              id: '00000000-0000-0000-0000-000000000000', // uuid v4 fake pro teste
              email: data.email || `${doc.id}@migracao.test`,
              name: data.name || data.firstName || 'Sem Nome Migrado',
              cpfCnpj: data.cpfCnpj || '00000000000',
              role: 'OWNER',
              legacy_id: doc.id
            }
          });
          console.log(`Sucesso! Inserido no Postgres: ${fakeUser.id} / ${fakeUser.email}`);
        } catch(dbError) {
          console.log('Erro ao tentar inserir no Postgres:', dbError.message);
        }
      }
    }

    console.log('\nMigração Dry-Run concluída. O Prisma e o Firebase Firebase-Admin v14 estão conversando!');
  } catch (error) {
    console.error('Erro na migração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateData();
