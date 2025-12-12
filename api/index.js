const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const PORT = 3001;

// ============================================================================
// 1. CONFIGURAÇÕES INICIAIS
// ============================================================================

const allowedOrigins = [
  'https://hiveerp-catalogo.vercel.app',
  'https://hive-erp.vercel.app',
  /https:\/\/hiveerp-catalogo-.*\.vercel\.app$/,
  /https:\/\/hive-erp-.*\.vercel\.app$/,
  'http://localhost:5173',
  'http://localhost:5174'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') return allowedOrigin === origin;
      if (allowedOrigin instanceof RegExp) return allowedOrigin.test(origin);
      return false;
    });
    if (isAllowed) callback(null, true);
    else callback(new Error('Blocked by CORS'));
  }
}));

app.use(express.json({ limit: '50mb' }));

// Inicialização Firebase
let serviceAccount;
if (process.env.VERCEL_ENV === 'production') {
  if (!process.env.SERVICE_ACCOUNT_KEY) process.exit(1);
  try {
    serviceAccount = JSON.parse(Buffer.from(process.env.SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8'));
  } catch (e) { process.exit(1); }
} else {
  try { serviceAccount = require('./serviceAccountKey.json'); } catch (e) {}
}

if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

// ============================================================================
// 2. MAPA DO BANCO DE DADOS (DADOS ANTIGOS EM PORTUGUÊS)
// ============================================================================
// Aqui garantimos que a API lê as gavetas certas, mesmo com rotas em inglês.
const COLLECTIONS = {
  PRODUCTS: 'produtos',       // <--- DADOS REAIS
  SUPPLIERS: 'fornecedores',  // <--- DADOS REAIS
  CATEGORIES: 'categorias',   // <--- DADOS REAIS
  TRANSACTIONS: 'transactions',
  ORDERS: 'orders',
  COUPONS: 'coupons',
  CONFIG: db.collection('config').doc('settings')
};

// ============================================================================
// 3. MIDDLEWARE
// ============================================================================
const authenticateUser = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ message: 'Token required.' });
  try {
    await admin.auth().verifyIdToken(header.split(' ')[1]);
    next();
  } catch (error) { res.status(403).json({ message: 'Access denied.' }); }
};

// ============================================================================
// 4. ROTAS PÚBLICAS (PUBLIC ROUTES - ENGLISH)
// ============================================================================

// Catalog Products (/products-public)
// MANTIVE O ALIAS '/produtos-catalogo' PARA NÃO QUEBRAR O SEU CATÁLOGO ATUAL SE ELE AINDA ESTIVER ANTIGO
const getPublicProducts = async (req, res) => {
  try {
    const snapshot = await db.collection(COLLECTIONS.PRODUCTS).where('status', '==', 'ativo').get();
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(products);
  } catch (error) { res.status(500).json({ message: "Error fetching products." }); }
};
app.get('/products-public', getPublicProducts);   // Rota Padrão Nova
app.get('/produtos-catalogo', getPublicProducts); // Rota Legado (Para compatibilidade)

// Public Config (/config-public)
const getPublicConfig = async (req, res) => {
  try {
    const doc = await COLLECTIONS.CONFIG.get();
    res.json(doc.exists ? doc.data() : {});
  } catch (error) { res.status(500).json({ message: "Error config." }); }
};
app.get('/config-public', getPublicConfig);
app.get('/config-publica', getPublicConfig); // Legado

// Public Categories (/categories-public)
const getPublicCategories = async (req, res) => {
  try {
    const snapshot = await db.collection(COLLECTIONS.PRODUCTS).where('status', '==', 'ativo').get();
    const set = new Set();
    snapshot.docs.forEach(doc => { if (doc.data().category) set.add(doc.data().category); });
    res.json(Array.from(set).sort());
  } catch (error) { res.status(500).json({ message: "Error categories." }); }
};
app.get('/categories-public', getPublicCategories);

// Orders / Checkout
app.post('/orders', async (req, res) => {
  try {
    const data = req.body;
    if (!data.items || !data.total) return res.status(400).json({ message: "Invalid data." });

    const newOrder = {
      ...data,
      status: 'Aguardando Pagamento',
      financeiroRegistrado: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const batch = db.batch();
    const docRef = db.collection(COLLECTIONS.ORDERS).doc();
    batch.set(docRef, newOrder);

    data.items.forEach(item => {
      const prodRef = db.collection(COLLECTIONS.PRODUCTS).doc(item.id);
      batch.update(prodRef, { quantity: admin.firestore.FieldValue.increment(-item.quantidade) });
    });

    await batch.commit();
    res.status(201).json({ id: docRef.id, ...newOrder });
  } catch (error) { res.status(500).json({ message: "Error creating order." }); }
});

// Validate Coupon
app.post('/validate-coupon', async (req, res) => {
  try {
    const { code } = req.body;
    const s = await db.collection(COLLECTIONS.COUPONS)
      .where('code', '==', code.toUpperCase()).where('status', '==', 'ativo').limit(1).get();
    if (s.empty) return res.status(404).json({ message: "Invalid coupon" });
    res.json(s.docs[0].data());
  } catch (error) { res.status(500).json({ message: "Error validating coupon." }); }
});

// ============================================================================
// 5. ROTAS ADMIN (PROTECTED ROUTES - ENGLISH STANDARD)
// ============================================================================
app.use('/admin', authenticateUser);

// --- PRODUCTS (/admin/products) ---
app.get('/admin/products', async (req, res) => {
  const s = await db.collection(COLLECTIONS.PRODUCTS).orderBy('createdAt', 'desc').get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
});
app.post('/admin/products', async (req, res) => {
  const ref = await db.collection(COLLECTIONS.PRODUCTS).add({ ...req.body, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  res.status(201).json({ id: ref.id, ...req.body });
});
app.put('/admin/products/:id', async (req, res) => {
  await db.collection(COLLECTIONS.PRODUCTS).doc(req.params.id).update(req.body);
  res.json({ id: req.params.id, ...req.body });
});
app.delete('/admin/products/:id', async (req, res) => {
  await db.collection(COLLECTIONS.PRODUCTS).doc(req.params.id).delete();
  res.status(204).send();
});

// --- BULK IMPORT (/admin/products/bulk) ---
app.post('/admin/products/bulk', async (req, res) => {
  try {
    const products = req.body;
    if (!Array.isArray(products)) return res.status(400).json({ message: "Invalid list." });

    const batch = db.batch();
    products.forEach(prod => {
      const docRef = db.collection(COLLECTIONS.PRODUCTS).doc();
      const newProduct = {
        name: prod.name || 'No Name',
        code: prod.code || '',
        category: prod.category || 'Geral',
        supplierId: prod.supplierId || null,
        imageUrl: prod.imageUrl || '',
        costPrice: parseFloat(prod.costPrice) || 0,
        salePrice: parseFloat(prod.salePrice) || 0,
        quantity: parseInt(prod.quantity) || 0,
        description: prod.description || '',
        status: 'ativo',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      batch.set(docRef, newProduct);
    });
    await batch.commit();
    res.status(201).json({ message: "Bulk import success", count: products.length });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- SUPPLIERS (/admin/suppliers) ---
app.get('/admin/suppliers', async (req, res) => {
  const s = await db.collection(COLLECTIONS.SUPPLIERS).get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
});
app.post('/admin/suppliers', async (req, res) => {
  const ref = await db.collection(COLLECTIONS.SUPPLIERS).add(req.body);
  res.status(201).json({ id: ref.id, ...req.body });
});
app.put('/admin/suppliers/:id', async (req, res) => {
  await db.collection(COLLECTIONS.SUPPLIERS).doc(req.params.id).update(req.body);
  res.json({ id: req.params.id, ...req.body });
});
app.delete('/admin/suppliers/:id', async (req, res) => {
  await db.collection(COLLECTIONS.SUPPLIERS).doc(req.params.id).delete();
  res.status(204).send();
});

// --- CATEGORIES (/admin/categories) ---
app.get('/admin/categories', async (req, res) => {
  const s = await db.collection(COLLECTIONS.CATEGORIES).orderBy('name').get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
});
app.post('/admin/categories', async (req, res) => {
  const ref = await db.collection(COLLECTIONS.CATEGORIES).add(req.body);
  res.status(201).json({ id: ref.id, ...req.body });
});
app.delete('/admin/categories/:id', async (req, res) => {
  await db.collection(COLLECTIONS.CATEGORIES).doc(req.params.id).delete();
  res.status(204).send();
});

// --- TRANSACTIONS (/admin/transactions) ---
// PADRONIZADO: Agora é transactions (Inglês)
app.get('/admin/transactions', async (req, res) => {
  const s = await db.collection(TRANSACTIONS_COLLECTION).orderBy('date', 'desc').get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
});
// Alias para compatibilidade se o frontend ainda chamar transacoes
app.get('/admin/transacoes', async (req, res) => res.redirect('/admin/transactions'));

app.post('/admin/transactions', async (req, res) => {
  const t = { ...req.body, amount: parseFloat(req.body.amount), date: admin.firestore.Timestamp.fromDate(new Date(req.body.date)) };
  const ref = await db.collection(TRANSACTIONS_COLLECTION).add(t);
  res.status(201).json({ id: ref.id, ...t });
});
app.delete('/admin/transactions/:id', async (req, res) => {
  await db.collection(TRANSACTIONS_COLLECTION).doc(req.params.id).delete();
  res.status(204).send();
});

// --- DASHBOARD ---
app.get('/admin/dashboard-stats', async (req, res) => {
  try {
    const s = await db.collection(TRANSACTIONS_COLLECTION).get();
    if (s.empty) return res.json({ totalVendas: 0, totalDespesas: 0, lucroLiquido: 0, saldoTotal: 0 });

    const stats = s.docs.reduce((acc, doc) => {
      const d = doc.data();
      let amt = parseFloat(d.amount) || 0;
      let realAmt = d.type === 'despesa' && amt > 0 ? -amt : amt;
      acc.saldoTotal += realAmt;
      if (d.type === 'venda') acc.totalVendas += realAmt;
      else if (d.type === 'despesa') acc.totalDespesas += Math.abs(realAmt);
      return acc;
    }, { totalVendas: 0, totalDespesas: 0, saldoTotal: 0 });
    res.json({ ...stats, lucroLiquido: stats.saldoTotal });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/admin/dashboard-charts', async (req, res) => {
  try {
    const today = new Date();
    const s = await db.collection(TRANSACTIONS_COLLECTION).get();
    const last7Days = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(today.getDate() - i);
      last7Days[d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })] = 0;
    }
    let income = 0, expense = 0;
    s.docs.forEach(doc => {
      const d = doc.data();
      const date = d.date.toDate();
      const amt = parseFloat(d.amount);
      if (d.type === 'venda') income += amt;
      if (d.type === 'despesa') expense += Math.abs(amt);
      if (d.type === 'venda' && date >= new Date(new Date().setDate(today.getDate()-7))) {
        const day = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (last7Days[day] !== undefined) last7Days[day] += amt;
      }
    });
    const salesByDay = Object.keys(last7Days).map(k => ({ name: k, vendas: last7Days[k] }));
    res.json({ salesByDay, incomeVsExpense: [{ name: 'Receita', value: income }, { name: 'Despesa', value: expense }] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- CONFIG ---
app.get('/admin/config', async (req, res) => {
  const doc = await COLLECTIONS.CONFIG.get();
  res.json(doc.exists ? doc.data() : {});
});
app.post('/admin/config', async (req, res) => {
  await COLLECTIONS.CONFIG.set(req.body, { merge: true });
  res.json(req.body);
});

// --- ORDERS ---
app.get('/admin/orders', async (req, res) => {
  const s = await db.collection(ORDERS_COLLECTION).orderBy('createdAt', 'desc').get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
});
app.put('/admin/orders/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const orderRef = db.collection(ORDERS_COLLECTION).doc(req.params.id);
    const doc = await orderRef.get();
    if (!doc.exists) return res.status(404).json({ message: "Not found" });
    
    const data = doc.data();
    const batch = db.batch();

    // Lógica de Stock (Devolução)
    if (status === 'Cancelado' && data.status !== 'Cancelado') {
      data.items?.forEach(i => batch.update(db.collection(COLLECTIONS.PRODUCTS).doc(i.id), { quantity: admin.firestore.FieldValue.increment(i.quantidade) }));
    }
    // Lógica Financeira (Confirmação)
    let updateData = { status };
    if (status === 'Enviado' && !data.financeiroRegistrado) {
      const t = { type: 'venda', amount: data.total, description: `Pedido #${doc.id.substring(0,5).toUpperCase()}`, date: admin.firestore.Timestamp.now() };
      batch.set(db.collection(TRANSACTIONS_COLLECTION).doc(), t);
      updateData.financeiroRegistrado = true;
    }

    batch.update(orderRef, updateData);
    await batch.commit();
    res.json({ id: doc.id, status });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- COUPONS ---
app.get('/admin/coupons', async (req, res) => {
  const s = await db.collection(COUPONS_COLLECTION).get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
});
app.post('/admin/coupons', async (req, res) => {
  const ref = await db.collection(COUPONS_COLLECTION).add({ ...req.body, status: 'ativo' });
  res.status(201).json({ id: ref.id, ...req.body });
});
app.delete('/admin/coupons/:id', async (req, res) => {
  await db.collection(COUPONS_COLLECTION).doc(req.params.id).delete();
  res.status(204).send();
});

// --- REPORT ABC ---
app.get('/admin/reports/abc', async (req, res) => {
  try {
    const pSnaps = await db.collection(COLLECTIONS.PRODUCTS).where('status', '==', 'ativo').get();
    const oSnaps = await db.collection(ORDERS_COLLECTION).where('status', '!=', 'Cancelado').get();
    const map = {};
    pSnaps.forEach(d => { map[d.id] = { id: d.id, ...d.data(), revenue: 0, unitsSold: 0 }; });
    oSnaps.forEach(d => { d.data().items?.forEach(i => { if (map[i.id]) { map[i.id].revenue += (i.salePrice * i.quantidade); map[i.id].unitsSold += i.quantidade; }}); });
    let report = Object.values(map).sort((a, b) => b.revenue - a.revenue);
    const total = report.length;
    res.json(report.map((p, i) => ({ ...p, classification: (i/total <= 0.2) ? 'A' : (i/total <= 0.5) ? 'B' : 'C' })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

if (process.env.VERCEL_ENV !== 'production') {
  app.listen(PORT, () => console.log(`API running on ${PORT}`));
}

module.exports = app;