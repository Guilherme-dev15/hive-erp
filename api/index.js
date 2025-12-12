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
    else callback(new Error('Bloqueado pelo CORS'));
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
// 2. CONSTANTES DE COLEÇÃO (AQUI ESTAVA O ERRO!)
// ============================================================================
// Apontamos para os nomes em PORTUGUÊS onde seus dados realmente estão.
const PRODUCTS_COLLECTION = 'produtos';       // <--- Traz os produtos de volta
const SUPPLIERS_COLLECTION = 'fornecedores';  // <--- Traz os fornecedores de volta
const CATEGORIES_COLLECTION = 'categorias';   // <--- Traz as categorias de volta
const TRANSACTIONS_COLLECTION = 'transactions';
const CONFIG_PATH = db.collection('config').doc('settings');
const ORDERS_COLLECTION = 'orders';
const COUPONS_COLLECTION = 'coupons';

// ============================================================================
// 3. MIDDLEWARE AUTH
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
// 4. ROTAS PÚBLICAS (CATÁLOGO)
// ============================================================================

// Rota Pública do Catálogo (Com Tradutor de Dados Antigos)
app.get('/produtos-catalogo', async (req, res) => {
  try {
    // 1. Busca na coleção antiga
    const snapshot = await db.collection(PRODUCTS_COLLECTION).where('status', '==', 'ativo').get();
    
    if (snapshot.empty) return res.status(200).json([]);

    const produtos = snapshot.docs.map(doc => {
      const data = doc.data();
      
      // 2. O TRADUTOR: Normaliza os campos
      return {
        id: doc.id,
        // Garante que 'name' existe, ou tenta 'nome' (antigo), ou fallback
        name: data.name || data.nome || 'Produto Sem Nome',
        
        // Garante que 'imageUrl' existe, ou tenta 'imagem', 'foto', 'url'
        imageUrl: data.imageUrl || data.imagem || data.foto || data.url || null,
        
        // Garante 'salePrice', ou tenta 'preco', 'precoVenda'
        salePrice: parseFloat(data.salePrice || data.preco || data.precoVenda || 0),
        
        // Outros campos essenciais
        code: data.code || data.codigo || 'N/A',
        category: data.category || data.categoria || 'Geral',
        description: data.description || data.descricao || '',
        status: data.status || 'ativo',
        quantity: parseInt(data.quantity || data.quantidade || data.estoque || 0)
      };
    });

    res.status(200).json(produtos);
  } catch (error) {
    console.error("Erro catalogo:", error);
    res.status(500).json({ message: "Erro ao buscar produtos." });
  }
});

app.get('/config-publica', async (req, res) => {
  try {
    const doc = await CONFIG_PATH.get();
    res.json(doc.exists ? doc.data() : {});
  } catch (error) { res.status(500).json({ message: "Erro configuração." }); }
});

app.get('/categories-public', async (req, res) => {
  try {
    const snapshot = await db.collection(CATEGORIES_COLLECTION).get();
    const cats = new Set();
    snapshot.docs.forEach(doc => { if(doc.data().name) cats.add(doc.data().name); });
    res.json(Array.from(cats).sort());
  } catch (error) { res.status(500).json({ message: "Erro categorias." }); }
});

app.post('/orders', async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      status: 'Aguardando Pagamento',
      financeiroRegistrado: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const batch = db.batch();
    const docRef = db.collection(ORDERS_COLLECTION).doc();
    batch.set(docRef, orderData);

    if (orderData.items) {
      orderData.items.forEach(item => {
        const prodRef = db.collection(PRODUCTS_COLLECTION).doc(item.id);
        batch.update(prodRef, { quantity: admin.firestore.FieldValue.increment(-item.quantidade) });
      });
    }
    await batch.commit();
    res.status(201).json({ id: docRef.id, ...orderData });
  } catch (error) { res.status(500).json({ message: "Erro pedido." }); }
});

app.post('/validate-coupon', async (req, res) => {
  try {
    const { code } = req.body;
    const s = await db.collection(COUPONS_COLLECTION)
      .where('code', '==', code.toUpperCase()).where('status', '==', 'ativo').limit(1).get();
    if (s.empty) return res.status(404).json({ message: "Inválido" });
    res.json(s.docs[0].data());
  } catch (e) { res.status(500).json({ message: "Erro cupom." }); }
});

// ============================================================================
// 5. ROTAS ADMIN (PADRÃO INGLÊS - LÊ DE DADOS PORTUGUÊS)
// ============================================================================
app.use('/admin', authenticateUser);

// --- PRODUCTS (/admin/products) ---
app.get('/admin/products', async (req, res) => {
  const s = await db.collection(PRODUCTS_COLLECTION).orderBy('createdAt', 'desc').get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
});
app.post('/admin/products', async (req, res) => {
  const ref = await db.collection(PRODUCTS_COLLECTION).add({
    ...req.body, createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  res.status(201).json({ id: ref.id, ...req.body });
});
app.put('/admin/products/:id', async (req, res) => {
  await db.collection(PRODUCTS_COLLECTION).doc(req.params.id).update(req.body);
  res.json({ id: req.params.id, ...req.body });
});
app.delete('/admin/products/:id', async (req, res) => {
  await db.collection(PRODUCTS_COLLECTION).doc(req.params.id).delete();
  res.status(204).send();
});

// --- IMPORTAÇÃO EM MASSA (/admin/products/bulk) ---
app.post('/admin/products/bulk', async (req, res) => {
  try {
    const products = req.body;
    if (!Array.isArray(products)) return res.status(400).json({ message: "Lista inválida" });

    const batch = db.batch();
    products.forEach(prod => {
      // Salva na coleção 'produtos' (correta)
      const docRef = db.collection(PRODUCTS_COLLECTION).doc();
      const newProduct = {
        name: prod.name || 'Sem Nome',
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
    res.status(201).json({ message: "Sucesso", count: products.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- SUPPLIERS (/admin/suppliers) ---
app.get('/admin/suppliers', async (req, res) => {
  const s = await db.collection(SUPPLIERS_COLLECTION).get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
});
app.post('/admin/suppliers', async (req, res) => {
  const ref = await db.collection(SUPPLIERS_COLLECTION).add(req.body);
  res.status(201).json({ id: ref.id, ...req.body });
});
app.put('/admin/suppliers/:id', async (req, res) => {
  await db.collection(SUPPLIERS_COLLECTION).doc(req.params.id).update(req.body);
  res.json({ id: req.params.id, ...req.body });
});
app.delete('/admin/suppliers/:id', async (req, res) => {
  await db.collection(SUPPLIERS_COLLECTION).doc(req.params.id).delete();
  res.status(204).send();
});

// --- CATEGORIES (/admin/categories) ---
app.get('/admin/categories', async (req, res) => {
  const s = await db.collection(CATEGORIES_COLLECTION).orderBy('name').get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
});
app.post('/admin/categories', async (req, res) => {
  const ref = await db.collection(CATEGORIES_COLLECTION).add(req.body);
  res.status(201).json({ id: ref.id, ...req.body });
});
app.delete('/admin/categories/:id', async (req, res) => {
  await db.collection(CATEGORIES_COLLECTION).doc(req.params.id).delete();
  res.status(204).send();
});

// --- TRANSACTIONS (/admin/transacoes) ---
app.get('/admin/transacoes', async (req, res) => {
  const s = await db.collection(TRANSACTIONS_COLLECTION).orderBy('date', 'desc').get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
});
app.post('/admin/transacoes', async (req, res) => {
  const t = { ...req.body, amount: parseFloat(req.body.amount), date: admin.firestore.Timestamp.fromDate(new Date(req.body.date)) };
  const ref = await db.collection(TRANSACTIONS_COLLECTION).add(t);
  res.status(201).json({ id: ref.id, ...t });
});
app.delete('/admin/transacoes/:id', async (req, res) => {
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

// --- OUTROS ---
app.post('/admin/config', async (req, res) => {
  await CONFIG_PATH.set(req.body, { merge: true });
  res.json(req.body);
});
app.get('/admin/config', async (req, res) => {
  const doc = await CONFIG_PATH.get();
  res.json(doc.exists ? doc.data() : {});
});

app.get('/admin/orders', async (req, res) => {
  const s = await db.collection(ORDERS_COLLECTION).orderBy('createdAt', 'desc').get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
});
app.put('/admin/orders/:id', async (req, res) => {
  await db.collection(ORDERS_COLLECTION).doc(req.params.id).update({ status: req.body.status });
  res.json({ id: req.params.id, status: req.body.status });
});

// --- ROTA CUPONS ---
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

// --- RELATÓRIO ABC ---
app.get('/admin/reports/abc', async (req, res) => {
  const s = await db.collection(PRODUCTS_COLLECTION).where('status', '==', 'ativo').get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data(), revenue: 0, classification: 'C' })));
});

if (process.env.VERCEL_ENV !== 'production') {
  app.listen(PORT, () => console.log(`API running on ${PORT}`));
}

module.exports = app;