require('dotenv').config();
const admin = require('firebase-admin');

// 🚨 COLOQUE SEU UID REAL AQUI
const MEU_UID = "api/fix_migration.js"; 

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

async function migrarLogs() {
  console.log("📜 Vinculando histórico de estoque...");
  const snapshot = await db.collection('inventory_logs').get();
  
  if (snapshot.empty) {
    console.log("Nenhum log encontrado.");
    process.exit();
  }

  const batch = db.batch();
  let count = 0;

  snapshot.docs.forEach(doc => {
    if (!doc.data().userId) {
      batch.update(doc.ref, { userId: MEU_UID });
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`✅ ${count} logs vinculados com sucesso!`);
  }
  process.exit();
}

migrarLogs();