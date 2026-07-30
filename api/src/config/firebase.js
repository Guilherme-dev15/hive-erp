const admin = require('firebase-admin');

function initializeFirebase() {
  if (admin.apps.length) {
    return admin;
  }

  try {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
      console.log("✅ Firebase inicializado via Variáveis de Ambiente!");
    } else {
      const serviceAccount = require('../../serviceAccountKey.json');
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      console.log("✅ Firebase inicializado via Arquivo Local!");
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
