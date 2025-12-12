const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const PORT = 3001;

// ============================================================================
// 1. CONFIGURAÇÕES INICIAIS (CORS & FIREBASE)
// ============================================================================

const allowedOrigins = [
  'https://hiveerp-catalogo.vercel.app',
  'https://hive-erp.vercel.app',
  /https:\/\/hiveerp-catalogo-.*\.vercel\.app$/,
  /https:\/\/hive-erp-.*\.vercel\.app$/,
  'http://localhost:5173',
  'http://localhost:5174'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') return allowedOrigin === origin;
      if (allowedOrigin instanceof RegExp) return allowedOrigin.test(origin);
      return false;
    });
    if (isAllowed) {
      callback(null, true);
    } else {
      console.error(`Origem bloqueada pelo CORS: ${origin}`);
      callback(new Error('Bloqueado pelo CORS'));
    }
  }
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); // Limite aumentado para importação em massa

// Inicialização do Firebase
let serviceAccount;
if (process.env.VERCEL_ENV === 'production') {
  if (!process.env.SERVICE_ACCOUNT_KEY) {
    console.error("ERRO: SERVICE_ACCOUNT_KEY não definida na Vercel.");
    process.exit(1);
  }
  try {
    serviceAccount = JSON.parse(Buffer.from(process.env.SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8'));
  } catch (e) {
    console.error("Erro no parse da chave:", e.message);
    process.exit(1);
  }
} else {
  try {
    serviceAccount = require('./serviceAccountKey.json');
  } catch (error) {
    console.error("ERRO: 'serviceAccountKey.json' não encontrado localmente.");
  }
}

if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// ============================================================================
// 2. CONSTANTES DE COLEÇÃO (A PONTE ENTRE O NOVO E O ANTIGO)
// ============================================================================
// As rotas são em INGLÊS, mas as coleções são em PORTUGUÊS para manter os dados.
const CONFIG_PATH = db.collection('config').doc('settings');
const PRODUCTS_COLLECTION = 'produtos';       // <--- Mantém dados antigos
const SUPPLIERS_COLLECTION = 'fornecedores';  // <--- Mantém dados antigos
const CATEGORIES_COLLECTION = 'categorias';   // <--- Mantém dados antigos
const TRANSACTIONS_COLLECTION = 'transactions';
const ORDERS_COLLECTION = 'orders';
const COUPONS_COLLECTION = 'coupons';

// ============================================================================
// 3. ROTAS PÚBLICAS (Catálogo & Configuração)
// ============================================================================

// Listar Produtos do Catálogo (Rota Legada mantida para compatibilidade, mas lê 'produtos')
app.get('/produtos-catalogo', async (req, res) => {
  try {
    const snapshot = await db.collection(PRODUCTS_COLLECTION).where('status', '==', 'ativo').get();
    if (snapshot.empty) return res.status(200).json([]);

    const produtos = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        imageUrl: data.imageUrl || null,
        code: data.code || 'N/A',
        category: data.category || 'Geral',
        description: data.description || '',
        salePrice: data.salePrice || 0,
        status: data.status,
        quantity: data.quantity !== undefined ? data.quantity : 0
      };
    });
    res.status(200).json(produtos);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar produtos." });
  }
});

// Configuração Pública
app.get('/config-publica', async (req, res) => {
  try {
    const doc = await CONFIG_PATH.get();
    const settings = doc.exists ? doc.data() : {};

    res.status(200).json({
      whatsappNumber: settings.whatsappNumber || null,
      storeName: settings.storeName || "HivePratas",
      primaryColor: settings.primaryColor || "#D4AF37",
      secondaryColor: settings.secondaryColor || "#343434",
      banners: settings.banners || []
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar configuração." });
  }
});

// Categorias Públicas (Agora '/categories')
app.get('/categories', async (req, res) => {
  try {
    const snapshot = await db.collection(CATEGORIES_COLLECTION).get();
    // Extrai apenas nomes únicos e ordena
    const categorySet = new Set();
    snapshot.docs.forEach(doc => {
      if (doc.data().name) categorySet.add(doc.data().name);
    });
    res.status(200).json(Array.from(categorySet).sort());
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar categorias." });
  }
});
// Alias para compatibilidade antiga
app.get('/categories-public', async (req, res) => {
    res.redirect('/categories');
});

// Criar Pedido (Checkout)
app.post('/orders', async (req, res) => {
  try {
    const pedidoData = req.body;
    if (!pedidoData.items || !pedidoData.total) {
      return res.status(400).json({ message: "Dados incompletos." });
    }

    const novoPedido = {
      ...pedidoData,
      status: 'Aguardando Pagamento',
      financeiroRegistrado: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const batch = db.batch();
    const docRef = db.collection(ORDERS_COLLECTION).doc();
    batch.set(docRef, novoPedido);

    // Baixa de Stock Imediata
    pedidoData.items.forEach(item => {
      const prodRef = db.collection(PRODUCTS_COLLECTION).doc(item.id);
      batch.update(prodRef, { quantity: admin.firestore.FieldValue.increment(-item.quantidade) });
    });

    await batch.commit();
    res.status(201).json({ id: docRef.id, ...novoPedido });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao criar pedido." });
  }
});

// Validar Cupom
app.post('/validate-coupon', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "Código obrigatório." });

    const snapshot = await db.collection(COUPONS_COLLECTION)
      .where('code', '==', code.toUpperCase())
      .where('status', '==', 'ativo')
      .limit(1)
      .get();

    if (snapshot.empty) return res.status(404).json({ message: "Cupão inválido." });

    const coupon = snapshot.docs[0].data();
    res.status(200).json({ code: coupon.code, discountPercent: coupon.discountPercent });
  } catch (error) {
    res.status(500).json({ message: "Erro ao validar." });
  }
});

// ============================================================================
// 4. MIDDLEWARE DE SEGURANÇA
// ============================================================================
const authenticateUser = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não fornecido.' });
  }
  try {
    const token = header.split(' ')[1];
    await admin.auth().verifyIdToken(token);
    next();
  } catch (error) {
    res.status(403).json({ message: 'Acesso negado.' });
  }
};

app.use('/admin', authenticateUser);

// ============================================================================
// 5. ROTAS ADMIN (Padronizadas em Inglês)
// ============================================================================

// --- Products (/admin/products) ---
app.get('/admin/products', async (req, res) => {
  const s = await db.collection(PRODUCTS_COLLECTION).orderBy('createdAt', 'desc').get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
});

app.post('/admin/products', async (req, res) => {
  const ref = await db.collection(PRODUCTS_COLLECTION).add({
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
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

// --- Importação em Massa (/admin/products/bulk) ---
app.post('/admin/products/bulk', async (req, res) => {
  try {
    const products = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Nenhum produto enviado." });
    }

    const batch = db.batch();

    products.forEach(prod => {
      const docRef = db.collection(PRODUCTS_COLLECTION).doc();

      const custo = parseFloat(prod.costPrice) || 0;
      let venda = parseFloat(prod.salePrice);

      if (!venda || venda <= 0) {
        venda = custo * 2; 
      }

      const newProduct = {
        name: prod.name || 'Produto Sem Nome',
        code: prod.code || '',
        category: prod.category || 'Geral',
        supplierId: prod.supplierId || null,
        imageUrl: prod.imageUrl || '', 
        costPrice: custo,
        salePrice: venda,
        quantity: parseInt(prod.quantity) || 0,
        description: prod.description || '',
        status: 'ativo',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      batch.set(docRef, newProduct);
    });

    await batch.commit();
    res.status(201).json({ message: "Importação concluída!", count: products.length });

  } catch (error) {
    console.error("ERRO na Importação:", error);
    res.status(500).json({ message: "Erro ao importar.", error: error.message });
  }
});

// --- Suppliers (/admin/suppliers) ---
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

// --- Categories (/admin/categories) ---
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

// --- Transactions (/admin/transacoes - mantido legado se frontend chama assim, ou mudamos para transactions) ---
// Para padronizar 100% em inglês, o ideal seria /admin/transactions, mas mantive o que estava no seu código.
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

// --- Dashboard Stats ---
app.get('/admin/dashboard-stats', async (req, res) => {
  try {
    const snapshot = await db.collection(TRANSACTIONS_COLLECTION).get();

    if (snapshot.empty) {
      return res.status(200).json({ totalVendas: 0, totalDespesas: 0, lucroLiquido: 0, saldoTotal: 0 });
    }

    const stats = snapshot.docs.reduce((acc, doc) => {
      const data = doc.data();
      let amount = parseFloat(data.amount);
      if (isNaN(amount)) amount = 0;

      let realAmount = amount;
      if (data.type === 'despesa' && amount > 0) {
        realAmount = -amount;
      }

      acc.saldoTotal += realAmount;

      if (data.type === 'venda') {
        acc.totalVendas += realAmount;
      } else if (data.type === 'despesa') {
        acc.totalDespesas += Math.abs(realAmount);
      }
      return acc;
    }, { totalVendas: 0, totalDespesas: 0, saldoTotal: 0 });

    res.status(200).json({
      totalVendas: stats.totalVendas,
      totalDespesas: stats.totalDespesas,
      lucroLiquido: stats.saldoTotal,
      saldoTotal: stats.saldoTotal
    });

  } catch (error) {
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});

// --- Dashboard Charts ---
app.get('/admin/dashboard-charts', async (req, res) => {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    const snapshot = await db.collection(TRANSACTIONS_COLLECTION).get();

    const last7Days = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      last7Days[d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })] = 0;
    }

    let income = 0, expense = 0;
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const date = data.date.toDate();
      const amount = parseFloat(data.amount);

      if (data.type === 'venda') income += amount;
      if (data.type === 'despesa') expense += Math.abs(amount);

      if (data.type === 'venda' && date >= sevenDaysAgo) {
        const dayStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (last7Days[dayStr] !== undefined) last7Days[dayStr] += amount;
      }
    });

    const salesByDay = Object.keys(last7Days).map(key => ({ name: key, vendas: last7Days[key] }));
    res.json({ salesByDay, incomeVsExpense: [{ name: 'Receita', value: income }, { name: 'Despesa', value: expense }] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Config (/admin/config) ---
app.get('/admin/config', async (req, res) => {
  const doc = await CONFIG_PATH.get();
  res.json(doc.exists ? doc.data() : {});
});
app.post('/admin/config', async (req, res) => {
  await CONFIG_PATH.set(req.body, { merge: true });
  res.json(req.body);
});

// --- Coupons (/admin/coupons) ---
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

// --- Orders (/admin/orders) ---
app.get('/admin/orders', async (req, res) => {
  const s = await db.collection(ORDERS_COLLECTION).orderBy('createdAt', 'desc').get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
});

app.put('/admin/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const orderRef = db.collection(ORDERS_COLLECTION).doc(id);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) return res.status(404).json({ message: "Pedido não encontrado" });

    const orderData = orderDoc.data();
    const oldStatus = orderData.status;
    const batch = db.batch();

    // 1. Cancelamento: Devolve Stock
    if (status === 'Cancelado' && oldStatus !== 'Cancelado') {
      if (orderData.items) {
        orderData.items.forEach(item => {
          const prodRef = db.collection(PRODUCTS_COLLECTION).doc(item.id);
          batch.update(prodRef, { quantity: admin.firestore.FieldValue.increment(item.quantidade) });
        });
      }
    }

    // 2. Reativação: Remove Stock novamente
    if (oldStatus === 'Cancelado' && status !== 'Cancelado') {
      if (orderData.items) {
        orderData.items.forEach(item => {
          const prodRef = db.collection(PRODUCTS_COLLECTION).doc(item.id);
          batch.update(prodRef, { quantity: admin.firestore.FieldValue.increment(-item.quantidade) });
        });
      }
    }

    // 3. Venda Confirmada: Lança no Financeiro
    let updateData = { status };
    if (status === 'Enviado' && !orderData.financeiroRegistrado) {
      const transacao = {
        type: 'venda',
        amount: orderData.total,
        description: `Pedido #${id.substring(0, 5).toUpperCase()}`,
        date: admin.firestore.Timestamp.now()
      };
      const transRef = db.collection(TRANSACTIONS_COLLECTION).doc();
      batch.set(transRef, transacao);
      updateData.financeiroRegistrado = true;
    }

    batch.update(orderRef, updateData);
    await batch.commit();

    res.json({ id, status });

  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Erro ao atualizar pedido" });
  }
});

// --- Relatório ABC (/admin/reports/abc) ---
app.get('/admin/reports/abc', async (req, res) => {
  try {
    const pSnaps = await db.collection(PRODUCTS_COLLECTION).where('status', '==', 'ativo').get();
    const oSnaps = await db.collection(ORDERS_COLLECTION).where('status', '!=', 'Cancelado').get();

    const map = {};
    pSnaps.forEach(d => {
      const data = d.data();
      map[d.id] = { id: d.id, name: data.name, imageUrl: data.imageUrl, stock: data.quantity || 0, revenue: 0, unitsSold: 0 };
    });

    oSnaps.forEach(d => {
      const items = d.data().items || [];
      items.forEach(i => {
        if (map[i.id]) {
          map[i.id].revenue += (i.salePrice * i.quantidade);
          map[i.id].unitsSold += i.quantidade;
        }
      });
    });

    let report = Object.values(map).sort((a, b) => b.revenue - a.revenue);
    const total = report.length;
    report = report.map((p, i) => ({
      ...p,
      classification: (i / total <= 0.2) ? 'A' : (i / total <= 0.5) ? 'B' : 'C'
    }));

    res.json(report);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Inicialização Local
if (process.env.VERCEL_ENV !== 'production') {
  app.listen(PORT, () => console.log(`API a rodar na porta ${PORT}`));
}

module.exports = app;