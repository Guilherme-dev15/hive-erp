require('dotenv').config();
const admin = require('firebase-admin');

// 1. LEIA O UID DA VARIÁVEL DE AMBIENTE
const MEU_UID = process.env.TARGET_UID;

// 2. Validação de segurança
if (!MEU_UID) {
  console.error('❌ ERRO: A variável de ambiente TARGET_UID não foi definida.');
  console.error("Uso: TARGET_UID='seu-uid-aqui' node vincular_restante.js");
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function vincularRestante() {
  console.log('🚚 Vinculando Fornecedores e Cupons...');

  // Focando nas coleções que ficaram de fora antes
  const colecoes = ['suppliers', 'coupons'];

  for (const nomeColl of colecoes) {
    console.log(`🔎 Verificando ${nomeColl}...`);
    const snapshot = await db.collection(nomeColl).get();

    if (snapshot.empty) {
      console.log(`- Coleção ${nomeColl} está vazia no banco.`);
      continue;
    }

    const batch = db.batch();
    let contador = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      // Vincula se estiver sem userId OU se tiver o ID errado daquela vez
      if (!data.userId || data.userId === 'COLE_AQUI_O_UID_QUE_VOCE_COPIOU') {
        batch.update(doc.ref, { userId: MEU_UID });
        contador++;
      }
    });

    if (contador > 0) {
      await batch.commit();
      console.log(`✅ Sucesso! ${contador} itens vinculados em ${nomeColl}.`);
    } else {
      console.log(`- Todos os itens de ${nomeColl} já estão corretos.`);
    }
  }

  console.log('\n✨ Pronto! Agora sim, tudo está vinculado à sua conta.');
  process.exit();
}

vincularRestante().catch((err) => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
