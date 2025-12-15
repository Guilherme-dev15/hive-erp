const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const PORT = 3001;

// ============================================================================
// CONFIGURAÇÃO INICIAL
// ============================================================================

// Configuração de CORS (Permite acesso do seu Frontend e Localhost)
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
    const isAllowed = allowedOrigins.some(allowed => 
      typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
    );
    if (isAllowed) callback(null, true);
    else callback(new Error('Blocked by CORS'));
  }
}));

app.use(express.json({ limit: '50mb' }));

// Inicialização do Firebase
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
// CONSTANTES DE COLEÇÃO (PADRÃO INGLÊS 🇺🇸)
// ============================================================================
// Agora o sistema só olha para estas coleções. O que estava em 'produtos' (PT) será ignorado.
const COLL = {
  PRODUCTS: 'products',
  SUPPLIERS: 'suppliers',
  CATEGORIES: 'categories',
  TRANSACTIONS: 'transactions',
  ORDERS: 'orders',
  COUPONS: 'coupons',
  CONFIG: db.collection('config').doc('settings')
};

// Middleware de Autenticação
const authenticateUser = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ message: 'Token required.' });
  try {
    await admin.auth().verifyIdToken(header.split(' ')[1]);
    next();
  } catch (error) { res.status(403).json({ message: 'Access denied.' }); }
};

// ============================================================================
// ROTAS PÚBLICAS (CATÁLOGO)
// ============================================================================

// Busca produtos da coleção 'products' (Novo Padrão)
app.get('/products-public', async (req, res) => {
  try {
    const snapshot = await db.collection(COLL.PRODUCTS).where('status', '==', 'ativo').get();
    
    // Mapeamento direto (Sem traduções complexas)
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Garante números para evitar quebra no front
      salePrice: parseFloat(doc.data().salePrice || 0),
      quantity: parseInt(doc.data().quantity || 0)
    }));
    
    res.json(products);
  } catch (error) {
    console.error("Erro catalogo:", error);
    res.status(500).json([]);
  }
});

app.get('/categories-public', async (req, res) => {
  try {
    const s = await db.collection(COLL.CATEGORIES).orderBy('name').get();
    res.json(s.docs.map(d => d.data().name));
  } catch (e) { res.json([]); }
});

app.get('/config-public', async (req, res) => {
  const doc = await COLL.CONFIG.get();
  res.json(doc.exists ? doc.data() : {});
});

// Salvar Pedido (Checkout)
app.post('/orders', async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      status: 'Aguardando Pagamento',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const batch = db.batch();
    const orderRef = db.collection(COLL.ORDERS).doc();
    batch.set(orderRef, orderData);

    // Baixa de Estoque
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

app.post('/validate-coupon', async (req, res) => {
  try {
    const { code } = req.body;
    const s = await db.collection(COLL.COUPONS)
      .where('code', '==', code.toUpperCase())
      .where('status', '==', 'ativo')
      .limit(1).get();
      
    if (s.empty) return res.status(404).json({ message: "Inválido" });
    res.json(s.docs[0].data());
  } catch (e) { res.status(500).json({ error: "Erro ao validar" }); }
});

// ============================================================================
// ROTAS ADMIN (PROTEGIDAS)
// ============================================================================
app.use('/admin', authenticateUser);

// --- PRODUTOS ---
app.get('/admin/products', async (req, res) => {
  const s = await db.collection(COLL.PRODUCTS).orderBy('createdAt', 'desc').get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
});

app.post('/admin/products', async (req, res) => {
  // Garante que os campos numéricos sejam salvos como números
  const productData = {
    ...req.body,
    salePrice: parseFloat(req.body.salePrice || 0),
    costPrice: parseFloat(req.body.costPrice || 0),
    quantity: parseInt(req.body.quantity || 0),
    status: req.body.status || 'ativo',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };
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

// --- IMPORTAÇÃO EM MASSA ---
app.post('/admin/products/bulk', async (req, res) => {
  try {
    const products = req.body;
    const batch = db.batch();
    products.forEach(p => {
      const ref = db.collection(COLL.PRODUCTS).doc();
      batch.set(ref, {
        ...p,
        salePrice: parseFloat(p.salePrice || 0),
        costPrice: parseFloat(p.costPrice || 0),
        quantity: parseInt(p.quantity || 0),
        status: 'ativo',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    await batch.commit();
    res.json({ success: true, count: products.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- CATEGORIAS ---
app.get('/admin/categories', async (req, res) => {
  const s = await db.collection(COLL.CATEGORIES).orderBy('name').get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
});
app.post('/admin/categories', async (req, res) => {
  const ref = await db.collection(COLL.CATEGORIES).add(req.body);
  res.json({ id: ref.id });
});
app.delete('/admin/categories/:id', async (req, res) => {
  await db.collection(COLL.CATEGORIES).doc(req.params.id).delete();
  res.sendStatus(204);
});

// --- FORNECEDORES ---
app.get('/admin/suppliers', async (req, res) => {
  const s = await db.collection(COLL.SUPPLIERS).get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
});
app.post('/admin/suppliers', async (req, res) => {
  const ref = await db.collection(COLL.SUPPLIERS).add(req.body);
  res.json({ id: ref.id });
});
app.delete('/admin/suppliers/:id', async (req, res) => {
  await db.collection(COLL.SUPPLIERS).doc(req.params.id).delete();
  res.sendStatus(204);
});

// --- FINANCEIRO ---
app.get('/admin/transactions', async (req, res) => {
  const s = await db.collection(COLL.TRANSACTIONS).orderBy('date', 'desc').get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
});
app.post('/admin/transactions', async (req, res) => {
  const t = req.body;
  if(t.date) t.date = admin.firestore.Timestamp.fromDate(new Date(t.date));
  const ref = await db.collection(COLL.TRANSACTIONS).add(t);
  res.json({ id: ref.id });
});
app.delete('/admin/transactions/:id', async (req, res) => {
  await db.collection(COLL.TRANSACTIONS).doc(req.params.id).delete();
  res.sendStatus(204);
});

// --- PEDIDOS ---
app.get('/admin/orders', async (req, res) => {
  const s = await db.collection(COLL.ORDERS).orderBy('createdAt', 'desc').get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
});
app.put('/admin/orders/:id', async (req, res) => {
  await db.collection(COLL.ORDERS).doc(req.params.id).update({ status: req.body.status });
  res.json({ id: req.params.id });
});
app.delete('/admin/orders/:id', async (req, res) => {
  await db.collection(COLL.ORDERS).doc(req.params.id).delete();
  res.sendStatus(204);
});

// --- CONFIG & CUPONS ---
app.post('/admin/config', async (req, res) => {
  await COLL.CONFIG.set(req.body, { merge: true });
  res.json(req.body);
});
app.get('/admin/config', async (req, res) => {
  const doc = await COLL.CONFIG.get();
  res.json(doc.exists ? doc.data() : {});
});

app.get('/admin/coupons', async (req, res) => {
  const s = await db.collection(COLL.COUPONS).get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
});
app.post('/admin/coupons', async (req, res) => {
  const ref = await db.collection(COLL.COUPONS).add(req.body);
  res.json({ id: ref.id });
});
app.delete('/admin/coupons/:id', async (req, res) => {
  await db.collection(COLL.COUPONS).doc(req.params.id).delete();
  res.sendStatus(204);
});

// --- DASHBOARD ---
app.get('/admin/dashboard-stats', async (req, res) => {
  try {
    const s = await db.collection(COLL.TRANSACTIONS).get();
    const p = await db.collection(COLL.PRODUCTS).where('status', '==', 'ativo').count().get();
    
    let totalVendas = 0, totalDespesas = 0;
    s.docs.forEach(d => {
       const val = parseFloat(d.data().amount) || 0;
       if(d.data().type === 'venda') totalVendas += val;
       else totalDespesas += Math.abs(val);
    });
    
    res.json({ 
      totalVendas, 
      totalDespesas, 
      lucroLiquido: totalVendas - totalDespesas, 
      saldoTotal: totalVendas - totalDespesas,
      activeProducts: p.data().count
    });
  } catch (e) { res.json({ totalVendas:0, totalDespesas:0, lucroLiquido:0, activeProducts:0 }); }
});

app.get('/admin/dashboard-charts', async (req, res) => {
  try {
    const s = await db.collection(COLL.TRANSACTIONS).orderBy('date', 'asc').get();
    const salesMap = {}, expenseMap = {};

    s.docs.forEach(doc => {
      const d = doc.data();
      const val = parseFloat(d.amount) || 0;
      const dateObj = d.date.toDate ? d.date.toDate() : new Date(d.date);
      const dateLabel = `${dateObj.getDate().toString().padStart(2,'0')}/${(dateObj.getMonth()+1).toString().padStart(2,'0')}`;

      if (d.type === 'venda') {
        salesMap[dateLabel] = (salesMap[dateLabel] || 0) + val;
      } else {
        const cat = d.category || 'Geral';
        expenseMap[cat] = (expenseMap[cat] || 0) + Math.abs(val);
      }
    });

    res.json({
      salesByDay: Object.keys(salesMap).map(k => ({ name: k, vendas: salesMap[k] })),
      incomeVsExpense: Object.keys(expenseMap).map(k => ({ name: k, value: expenseMap[k] }))
    });
  } catch (e) { res.json({ salesByDay: [], incomeVsExpense: [] }); }
});

app.get('/admin/reports/abc', (req, res) => res.json([]));

if (process.env.VERCEL_ENV !== 'production') {
  app.listen(PORT, () => console.log(`API PADRÃO (LIMPA) rodando na porta ${PORT}`));
}

module.exports = app;