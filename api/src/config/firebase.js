const admin = require('firebase-admin');

function initializeFirebase() {
  if (admin.apps.length) {
    return admin;
  }

  try {
    // Prioriza a variável de ambiente para produção (Vercel, GitHub Actions)
    if (process.env.SERVICE_ACCOUNT_KEY_JSON) {
      const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY_JSON);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("✅ Firebase inicializado via Variável de Ambiente (SERVICE_ACCOUNT_KEY_JSON)!");
    } else {
      // Fallback para o arquivo local para desenvolvimento
      const serviceAccount = require('../../serviceAccountKey.json');
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      console.log("✅ Firebase inicializado via Arquivo Local (serviceAccountKey.json)!");
    }
  } catch (error) {
    console.error("❌ FALHA AO INICIAR FIREBASE:", error.message);
  }
  return admin;
}

const firebaseAdmin = initializeFirebase();
const db = firebaseAdmin.firestore();

const COLLECTIONS = {
  PRODUCTS: 'products',
  SUPPLIERS: 'suppliers',
  CATEGORIES: 'categories',
  TRANSACTIONS: 'transactions',
  ORDERS: 'orders',
  COUPONS: 'coupons',
  CONFIG: 'config',
  INVENTORY_LOGS: 'inventory_logs'
};

module.exports = {
  db,
  admin: firebaseAdmin,
  COLLECTIONS,
};
