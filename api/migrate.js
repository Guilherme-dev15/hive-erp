require('dotenv').config();
const admin = require('firebase-admin');

// 1. COLE SEU UID AQUI DENTRO DAS ASPAS
const MEU_UID = "He8p0wAioIctG7ZBIIxG4C9YOmX2"; 

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

async function vincularTudo() {
  console.log("🚀 Iniciando migração de dados...");
  
  // Lista de coleções que precisam ser vinculadas
  const colecoes = ['products', 'categories', 'transactions', 'orders'];

  for (const nomeColl of colecoes) {
    console.log(`📦 Processando coleção: ${nomeColl}...`);
    const snapshot = await db.collection(nomeColl).get();
    
    if (snapshot.empty) {
      console.log(`- Coleção ${nomeColl} vazia. Pulando.`);
      continue;
    }

    const batch = db.batch();
    let contador = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      // Só atualiza se o documento ainda não tiver um dono
      if (!data.userId) {
        batch.update(doc.ref, { userId: MEU_UID });
        contador++;
      }
    });

    if (contador > 0) {
      await batch.commit();
      console.log(`✅ Sucesso! ${contador} itens vinculados em ${nomeColl}.`);
    } else {
      console.log(`- Todos os itens de ${nomeColl} já possuem dono.`);
    }
  }

  console.log("\n✨ Migração concluída! Todos os dados agora pertencem à sua conta.");
  process.exit();
}

vincularTudo().catch(err => {
  console.error("❌ Erro na migração:", err);
  process.exit(1);
});