require('dotenv').config();
const admin = require('firebase-admin');

// 1. 🚨 COLOQUE SEU UID REAL AQUI DENTRO DAS ASPAS 🚨
const UID_CORRETO = "He8p0wAioIctG7ZBIIxG4C9YOmX2"; 

// O erro que vamos caçar no banco
const UID_ERRADO = "COLE_AQUI_O_UID_QUE_VOCE_COPIOU";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

async function corrigirMigracao() {
  console.log("🕵️‍♂️ Iniciando busca por documentos com ID errado...");
  
  const colecoes = ['products', 'categories', 'transactions', 'orders'];

  for (const nomeColl of colecoes) {
    console.log(`🔎 Verificando ${nomeColl}...`);
    
    // Busca apenas os que foram "carimbados" errado
    const snapshot = await db.collection(nomeColl)
      .where('userId', '==', UID_ERRADO)
      .get();
    
    if (snapshot.empty) {
      console.log(`- Nada errado em ${nomeColl}.`);
      continue;
    }

    const batch = db.batch();
    let contador = 0;

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { userId: UID_CORRETO });
      contador++;
    });

    await batch.commit();
    console.log(`✅ Sucesso! ${contador} itens corrigidos em ${nomeColl}.`);
  }

  console.log("\n✨ Tudo pronto! Agora os dados pertencem ao seu ID real.");
  process.exit();
}

corrigirMigracao().catch(err => {
  console.error("❌ Erro:", err);
  process.exit(1);
});