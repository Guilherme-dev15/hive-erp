require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// 1. CONFIGURAÇÃO DE CORS
// ============================================================================
const allowedOrigins = [
  'https://hiveerp-catalogo.vercel.app',
  'https://hive-erp.vercel.app',
  /https:\/\/hiveerp-catalogo-.*\.vercel\.app$/,
  /https:\/\/hive-erp-.*\.vercel\.app$/,
  'http://localhost:5173', // Catálogo Local
  'http://localhost:5174'  // Admin Local
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.some(allowed =>
      typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
    );
    if (isAllowed) callback(null, true);
    else callback(new Error('Bloqueado pelo CORS'));
  }
}));

app.use(express.json({ limit: '50mb' }));

// ============================================================================
// 2. INICIALIZAÇÃO DO FIREBASE
// ============================================================================
function initializeFirebase() {
  if (admin.apps.length) return admin.firestore();

  try {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey
        })
      });
      console.log("✅ Firebase inicializado via Variáveis de Ambiente!");
    } else {
      const serviceAccount = require('./serviceAccountKey.json');
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      console.log("✅ Firebase inicializado via Arquivo Local!");
    }
  } catch (error) {
    console.error("❌ FALHA AO INICIAR FIREBASE:", error.message);
  }
  return admin.firestore();
}

const db = initializeFirebase();
const COLL = {
  PRODUCTS: 'products',
  SUPPLIERS: 'suppliers',
  CATEGORIES: 'categories',
  TRANSACTIONS: 'transactions',
  ORDERS: 'orders',
  COUPONS: 'coupons',
  CONFIG: 'config' // <--- MUDADO PARA SINGULAR CONFORME SEU BANCO
};

// ============================================================================
// 3. MIDDLEWARE DE AUTENTICAÇÃO
// ============================================================================
const authenticateUser = async (req, res, next) => {
  if (!admin.apps.length) return res.status(500).json({ error: "Servidor offline" });
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ message: 'Token necessário.' });

  try {
    const decodedToken = await admin.auth().verifyIdToken(header.split(' ')[1]);
    req.user = { uid: decodedToken.uid, email: decodedToken.email };
    next();
  } catch (error) {
    res.status(403).json({ message: 'Acesso negado.' });
  }
};

// ============================================================================
// 4. ROTAS PÚBLICAS (CATÁLOGO)
// ============================================================================

// --- BUSCAR LOJA POR NOME (SLUG) ---
app.get('/config-by-slug', async (req, res) => {
  const { slug } = req.query;
  console.log("🔍 Buscando config na coleção 'config' com slug:", slug);

  if (!slug) return res.status(400).json({ error: "Nome da loja não informado" });

  try {
    // Busca na coleção 'config' (singular)
    const snapshot = await db.collection(COLL.CONFIG)
      .where('slug', '==', slug.toLowerCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.log("❌ Nenhuma config encontrada para:", slug);
      return res.status(404).json({ message: "Loja não encontrada" });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    // 🚨 O PULO DO GATO:
    // Se o documento tiver um campo 'userId', usamos ele como ID da loja (para achar os produtos).
    // Se não, usamos o ID do documento (fallback).
    const realStoreId = data.userId || doc.id;
    console.log("✅ Loja achada! ID real para buscar produtos:", realStoreId);

    res.json({ 
      ...data, 
      storeId: realStoreId 
    });
  } catch (e) {
    console.error("Erro config-by-slug:", e);
    res.status(500).json({ error: e.message });
  }
});

// --- CONFIGURAÇÃO PÚBLICA (POR ID) ---
app.get('/config-public', async (req, res) => {
  const { storeId } = req.query;
  if (!storeId) return res.status(400).json({ error: "storeId é necessário" });

  try {
    // Tenta buscar pelo ID direto. Se não achar, tenta buscar onde userId == storeId
    let doc = await db.collection(COLL.CONFIG).doc(storeId).get();
    
    if (!doc.exists) {
        // Fallback: Busca query por userId caso o ID do doc seja diferente (ex: 'settings')
        const snap = await db.collection(COLL.CONFIG).where('userId', '==', storeId).limit(1).get();
        if (!snap.empty) doc = snap.docs[0];
    }

    if (!doc.exists) {
      return res.json({ 
        storeName: "Loja Virtual", 
        primaryColor: "#000000", 
        banners: [] 
      }); 
    }
    res.json(doc.data());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- VALIDAÇÃO DE CUPOM ---
app.post('/validate-coupon', async (req, res) => {
  const { code, storeId } = req.body;
  if (!code || !storeId) return res.status(200).json({ valid: false, message: "Dados incompletos" });

  try {
    const snapshot = await db.collection(COLL.COUPONS)
      .where('userId', '==', storeId)
      .where('code', '==', code.toUpperCase())
      .get(); 

    if (snapshot.empty) return res.status(200).json({ valid: false, message: "Cupom inválido" });

    const cupom = snapshot.docs[0].data();
    if (cupom.status && cupom.status !== 'ativo') return res.status(200).json({ valid: false, message: "Cupom inativo" });

    res.json({ 
      valid: true, 
      discountValue: Number(cupom.discountValue || cupom.discountPercent || cupom.percent || 0), 
      type: cupom.type || 'percentage', 
      code: cupom.code 
    });
  } catch (e) { res.status(500).json({ valid: false, message: "Erro interno" }); }
});

// --- PRODUTOS PÚBLICOS ---
app.get('/products-public', async (req, res) => {
  if (!db) return res.json([]);
  try {
    let query = db.collection(COLL.PRODUCTS).where('status', '==', 'ativo');
    if (req.query.storeId) query = query.where('userId', '==', req.query.storeId);
    
    const snapshot = await query.get();
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      salePrice: parseFloat(doc.data().salePrice || 0),
      quantity: parseInt(doc.data().quantity || 0)
    }));
    res.json(products);
  } catch (error) { res.status(500).json([]); }
});

// --- CATEGORIAS PÚBLICAS ---
app.get('/categories-public', async (req, res) => {
  if (!db) return res.json([]);
  try {
    let query = db.collection(COLL.CATEGORIES);
    if (req.query.storeId) query = query.where('userId', '==', req.query.storeId);
    const s = await query.orderBy('name').get();
    res.json(s.docs.map(d => d.data().name));
  } catch (e) { res.json([]); }
});

// --- CRIAR PEDIDO ---
app.post('/orders', async (req, res) => {
  try {
    let storeOwnerId = null;
    if (req.body.items?.length > 0) {
      const firstProduct = await db.collection(COLL.PRODUCTS).doc(req.body.items[0].id).get();
      if (firstProduct.exists) storeOwnerId = firstProduct.data().userId;
    }
    if (!storeOwnerId && req.body.storeId) storeOwnerId = req.body.storeId;

    const orderData = { 
      ...req.body, 
      userId: storeOwnerId, 
      status: 'Pendente', 
      createdAt: admin.firestore.FieldValue.serverTimestamp() 
    };

    const batch = db.batch();
    const orderRef = db.collection(COLL.ORDERS).doc();
    batch.set(orderRef, orderData);

    if (orderData.items && Array.isArray(orderData.items)) {
      orderData.items.forEach(item => {
        const prodRef = db.collection(COLL.PRODUCTS).doc(item.id);
        batch.update(prodRef, { quantity: admin.firestore.FieldValue.increment(-item.quantidade) });
      });
    }
    await batch.commit();
    res.status(201).json({ id: orderRef.id, ...orderData });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================================
// 5. ROTAS ADMIN (PROTEGIDAS)
// ============================================================================
app.use('/admin', authenticateUser);

// CRUD Produtos
app.get('/admin/products', async (req, res) => {
  try {
    const s = await db.collection(COLL.PRODUCTS).where('userId', '==', req.user.uid).orderBy('createdAt', 'desc').get();
    res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/admin/products', async (req, res) => {
  const productData = { ...req.body, userId: req.user.uid, createdAt: admin.firestore.FieldValue.serverTimestamp() };
  const ref = await db.collection(COLL.PRODUCTS).add(productData);
  res.json({ id: ref.id, ...productData });
});
app.put('/admin/products/:id', async (req, res) => {
  await db.collection(COLL.PRODUCTS).doc(req.params.id).update(req.body);
  res.json({ id: req.params.id });
});
app.delete('/admin/products/:id', async (req, res) => {
  await db.collection(COLL.PRODUCTS).doc(req.params.id).delete();
  res.sendStatus(204);
});
app.post('/admin/products/bulk', async (req, res) => {
  const batch = db.batch();
  req.body.forEach(p => batch.set(db.collection(COLL.PRODUCTS).doc(), { ...p, userId: req.user.uid, createdAt: admin.firestore.FieldValue.serverTimestamp() }));
  await batch.commit();
  res.json({ success: true });
});

// CRUD Categorias
app.get('/admin/categories', async (req, res) => {
  const s = await db.collection(COLL.CATEGORIES).where('userId', '==', req.user.uid).orderBy('name').get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
});
app.post('/admin/categories', async (req, res) => {
  const ref = await db.collection(COLL.CATEGORIES).add({ ...req.body, userId: req.user.uid });
  res.json({ id: ref.id });
});
app.delete('/admin/categories/:id', async (req, res) => {
  await db.collection(COLL.CATEGORIES).doc(req.params.id).delete();
  res.sendStatus(204);
});

// CRUD Fornecedores
app.get('/admin/suppliers', async (req, res) => {
  const s = await db.collection(COLL.SUPPLIERS).where('userId', '==', req.user.uid).get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
});
app.post('/admin/suppliers', async (req, res) => {
  const ref = await db.collection(COLL.SUPPLIERS).add({ ...req.body, userId: req.user.uid });
  res.json({ id: ref.id });
});

// Financeiro
app.get('/admin/transactions', async (req, res) => {
  try {
    const s = await db.collection(COLL.TRANSACTIONS).where('userId', '==', req.user.uid).orderBy('date', 'desc').get();
    res.json(s.docs.map(d => ({ id: d.id, ...d.data(), date: d.data().date?.toDate?.() || d.data().date })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/admin/transactions', async (req, res) => {
  const t = req.body;
  if (t.date) t.date = admin.firestore.Timestamp.fromDate(new Date(t.date));
  const ref = await db.collection(COLL.TRANSACTIONS).add({ ...t, userId: req.user.uid });
  res.json({ id: ref.id });
});
app.delete('/admin/transactions/:id', async (req, res) => {
  await db.collection(COLL.TRANSACTIONS).doc(req.params.id).delete();
  res.sendStatus(204);
});

// Pedidos Admin
app.get('/admin/orders', async (req, res) => {
  const s = await db.collection(COLL.ORDERS).where('userId', '==', req.user.uid).orderBy('createdAt', 'desc').get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
});
app.put('/admin/orders/:id', async (req, res) => {
  await db.collection(COLL.ORDERS).doc(req.params.id).update({ status: req.body.status });
  res.json({ id: req.params.id });
});

// Dashboard
app.get('/admin/dashboard-stats', async (req, res) => {
  try {
    const s = await db.collection(COLL.TRANSACTIONS).where('userId', '==', req.user.uid).get();
    let v = 0, d = 0;
    s.docs.forEach(doc => {
      const val = parseFloat(doc.data().amount) || 0;
      doc.data().type === 'receita' ? v += val : d += val;
    });
    res.json({ totalVendas: v, totalDespesas: d, lucroLiquido: v - d });
  } catch (e) { res.json({ totalVendas: 0, totalDespesas: 0 }); }
});

// Estoque
app.post('/admin/inventory/adjust', async (req, res) => {
  const { productId, type, quantity, userName } = req.body;
  try {
    const productRef = db.collection(COLL.PRODUCTS).doc(productId);
    await db.runTransaction(async (t) => {
      const doc = await t.get(productRef);
      const newQty = type === 'entry' ? (doc.data().quantity||0) + Number(quantity) : (doc.data().quantity||0) - Number(quantity);
      t.update(productRef, { quantity: newQty });
      t.set(db.collection('inventory_logs').doc(), { userId: req.user.uid, productId, type, change: quantity, newQuantity: newQty, user: userName, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/admin/inventory/logs/:productId', async (req, res) => {
  const s = await db.collection('inventory_logs').where('productId', '==', req.params.productId).where('userId', '==', req.user.uid).orderBy('createdAt', 'desc').limit(20).get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
});

// Cupons Admin
app.get('/admin/coupons', async (req, res) => {
  const s = await db.collection(COLL.COUPONS).where('userId', '==', req.user.uid).get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
});
app.post('/admin/coupons', async (req, res) => {
  const data = { ...req.body, userId: req.user.uid, code: req.body.code.toUpperCase(), createdAt: admin.firestore.FieldValue.serverTimestamp() };
  const ref = await db.collection(COLL.COUPONS).add(data);
  res.json({ id: ref.id, ...data });
});
app.delete('/admin/coupons/:id', async (req, res) => {
  await db.collection(COLL.COUPONS).doc(req.params.id).delete();
  res.sendStatus(204);
});

// Config Admin
app.post('/admin/config', async (req, res) => {
  // ATENÇÃO: Se o frontend admin estiver salvando em 'configs' (plural) com ID do user,
  // precisamos decidir se mudamos lá ou aqui. 
  // Por enquanto, vou manter salvando em 'config' (singular) para alinhar com o banco atual.
  await db.collection(COLL.CONFIG).doc('settings').set({ ...req.body, userId: req.user.uid }, { merge: true });
  res.json(req.body);
});
app.get('/admin/config', async (req, res) => {
  const doc = await db.collection(COLL.CONFIG).doc('settings').get();
  res.json(doc.exists ? doc.data() : {});
});

if (process.env.VERCEL_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 API SaaS (Coleção: ${COLL.CONFIG}) Rodando na porta ${PORT}`);
    console.log(`👉 Teste: http://localhost:${PORT}/config-by-slug?slug=hivepratas`);
  });
}

module.exports = app;