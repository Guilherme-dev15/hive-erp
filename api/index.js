const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const PORT = 3001;

// ============================================================================
// CONFIGURAÇÃO INICIAL
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
    const isAllowed = allowedOrigins.some(allowed =>
      typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
    );
    if (isAllowed) callback(null, true);
    else callback(new Error('Bloqueado pelo CORS'));
  }
}));

app.use(express.json({ limit: '50mb' }));

// Inicialização do Firebase
let serviceAccount;
if (process.env.VERCEL_ENV === 'production') {
  if (!process.env.SERVICE_ACCOUNT_KEY) {
    console.error("ERRO CRÍTICO: Variável SERVICE_ACCOUNT_KEY não encontrada.");
    process.exit(1);
  }
  try {
    serviceAccount = JSON.parse(Buffer.from(process.env.SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8'));
  } catch (e) {
    console.error("Erro ao decodificar SERVICE_ACCOUNT_KEY", e);
    process.exit(1);
  }
} else {
  try { serviceAccount = require('./serviceAccountKey.json'); } catch (e) {
    console.warn("Aviso: serviceAccountKey.json não encontrado localmente.");
  }
}

if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.apps.length ? admin.firestore() : null;

// ============================================================================
// CONSTANTES DE COLEÇÃO
// ============================================================================
const COLL = {
  PRODUCTS: 'products',
  SUPPLIERS: 'suppliers',
  CATEGORIES: 'categories',
  TRANSACTIONS: 'transactions',
  ORDERS: 'orders',
  COUPONS: 'coupons',
  CONFIG: 'config' // Atenção: Config agora será por usuário também
};

// ============================================================================
// MIDDLEWARE DE AUTENTICAÇÃO (SaaS CORE)
// ============================================================================
const authenticateUser = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token necessário.' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(header.split(' ')[1]);
    
    // 🔒 AQUI ESTÁ A MÁGICA DO MULTITENANT
    req.user = { 
      uid: decodedToken.uid, 
      email: decodedToken.email 
    };
    
    next();
  } catch (error) { 
    console.error("Erro de Auth:", error);
    res.status(403).json({ message: 'Acesso negado.' }); 
  }
};

// ============================================================================
// ROTAS PÚBLICAS (CATÁLOGO)
// Nota: Em um SaaS real, você passaria ?storeId=UID para filtrar
// ============================================================================

app.get('/products-public', async (req, res) => {
  if (!db) return res.json([]);
  try {
    // Se o frontend mandar ?storeId, filtramos. Se não, mostra tudo (Marketplace)
    let query = db.collection(COLL.PRODUCTS).where('status', '==', 'ativo');
    
    if (req.query.storeId) {
       query = query.where('userId', '==', req.query.storeId);
    }

    const snapshot = await query.get();

    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      salePrice: parseFloat(doc.data().salePrice || 0),
      quantity: parseInt(doc.data().quantity || 0)
    }));

    res.json(products);
  } catch (error) {
    console.error("Erro no catálogo:", error);
    res.status(500).json([]);
  }
});

app.get('/categories-public', async (req, res) => {
  if (!db) return res.json([]);
  try {
    let query = db.collection(COLL.CATEGORIES).orderBy('name');
    if (req.query.storeId) {
        query = db.collection(COLL.CATEGORIES).where('userId', '==', req.query.storeId);
    }
    const s = await query.get();
    res.json(s.docs.map(d => d.data().name));
  } catch (e) { res.json([]); }
});

// Checkout do Carrinho (Público)
app.post('/orders', async (req, res) => {
  if (!db) return res.status(500).json({ error: "Banco de dados offline" });
  try {
    // Tenta identificar o dono da loja pelo primeiro item do carrinho
    // (Isso é crucial para o pedido cair no painel certo)
    let storeOwnerId = null;
    if (req.body.items && req.body.items.length > 0) {
        const firstProduct = await db.collection(COLL.PRODUCTS).doc(req.body.items[0].id).get();
        if (firstProduct.exists) {
            storeOwnerId = firstProduct.data().userId;
        }
    }

    const orderData = {
      ...req.body,
      userId: storeOwnerId, // Associa o pedido ao dono da loja
      status: 'Pendente',
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

// ============================================================================
// ROTAS ADMIN (PROTEGIDAS E SCOPED POR USUÁRIO)
// ============================================================================
app.use('/admin', authenticateUser);

// --- PRODUTOS ---
app.get('/admin/products', async (req, res) => {
  try {
    // 🛡️ FILTRO: Só meus produtos
    const s = await db.collection(COLL.PRODUCTS)
      .where('userId', '==', req.user.uid) 
      .orderBy('createdAt', 'desc')
      .get();

    res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) {
    res.status(500).json({ error: "Erro ao buscar produtos: " + e.message });
  }
});

app.post('/admin/products', async (req, res) => {
  try {
    const productData = {
      ...req.body,
      // 🔒 CARIMBO DE DONO
      userId: req.user.uid,
      
      salePrice: parseFloat(req.body.salePrice || 0),
      costPrice: parseFloat(req.body.costPrice || 0),
      quantity: parseInt(req.body.quantity || 0),
      status: req.body.status || 'ativo',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const ref = await db.collection(COLL.PRODUCTS).add(productData);
    res.json({ id: ref.id, ...productData });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/admin/products/:id', async (req, res) => {
  // Segurança extra: verificar se o produto é do usuário antes de editar
  const docRef = db.collection(COLL.PRODUCTS).doc(req.params.id);
  const doc = await docRef.get();
  if (!doc.exists || doc.data().userId !== req.user.uid) {
      return res.status(403).json({ error: "Permissão negada ou produto não existe" });
  }
  await docRef.update(req.body);
  res.json({ id: req.params.id });
});

app.delete('/admin/products/:id', async (req, res) => {
  const docRef = db.collection(COLL.PRODUCTS).doc(req.params.id);
  const doc = await docRef.get();
  if (!doc.exists || doc.data().userId !== req.user.uid) {
      return res.status(403).json({ error: "Permissão negada" });
  }
  await docRef.delete();
  res.sendStatus(204);
});

// --- IMPORTAÇÃO EM MASSA (BLINDADA) ---
app.post('/admin/products/bulk', async (req, res) => {
  try {
    const products = req.body;
    const batch = db.batch();
    
    products.forEach(p => {
      const ref = db.collection(COLL.PRODUCTS).doc();
      batch.set(ref, {
        ...p,
        userId: req.user.uid, // 🔒 FORÇA O ID DO USUÁRIO EM TODOS
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

// --- CRUD BÁSICOS (CATEGORIAS / FORNECEDORES) ---
app.get('/admin/categories', async (req, res) => {
  const s = await db.collection(COLL.CATEGORIES)
    .where('userId', '==', req.user.uid)
    .orderBy('name').get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
});
app.post('/admin/categories', async (req, res) => {
  const ref = await db.collection(COLL.CATEGORIES).add({
      ...req.body,
      userId: req.user.uid
  });
  res.json({ id: ref.id });
});
app.delete('/admin/categories/:id', async (req, res) => {
    // Simplificado para deletar direto (na V2 adicionar verificação de dono aqui tb)
    await db.collection(COLL.CATEGORIES).doc(req.params.id).delete();
    res.sendStatus(204);
});

app.get('/admin/suppliers', async (req, res) => {
  const s = await db.collection(COLL.SUPPLIERS)
    .where('userId', '==', req.user.uid).get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
});
app.post('/admin/suppliers', async (req, res) => {
  const ref = await db.collection(COLL.SUPPLIERS).add({
      ...req.body,
      userId: req.user.uid
  });
  res.json({ id: ref.id });
});

// --- FINANCEIRO ---
app.get('/admin/transactions', async (req, res) => {
  const s = await db.collection(COLL.TRANSACTIONS)
    .where('userId', '==', req.user.uid)
    .orderBy('date', 'desc').get();

  res.json(s.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      date: data.date && data.date.toDate ? data.date.toDate().toISOString() : data.date
    };
  }));
});

app.post('/admin/transactions', async (req, res) => {
  const t = req.body;
  if (t.date) t.date = admin.firestore.Timestamp.fromDate(new Date(t.date));
  
  const ref = await db.collection(COLL.TRANSACTIONS).add({
      ...t,
      userId: req.user.uid // 🔒 Dono da transação
  });
  res.json({ id: ref.id });
});

app.delete('/admin/transactions/:id', async (req, res) => {
  await db.collection(COLL.TRANSACTIONS).doc(req.params.id).delete();
  res.sendStatus(204);
});

// --- PEDIDOS ---
app.get('/admin/orders', async (req, res) => {
  const s = await db.collection(COLL.ORDERS)
    .where('userId', '==', req.user.uid)
    .orderBy('createdAt', 'desc').get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
});

// FUNÇÃO AUXILIAR: LIMPEZA DE DINHEIRO
const parseMoney = (value) => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  try {
    const stringValue = String(value)
      .replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
    const number = parseFloat(stringValue);
    return isNaN(number) ? 0 : number;
  } catch (e) { return 0; }
};

// 🔥 ATUALIZAÇÃO DE STATUS + FINANCEIRO (SCOPED)
app.put('/admin/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const orderRef = db.collection(COLL.ORDERS).doc(id);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) return res.status(404).json({ error: "Pedido não encontrado" });
    const order = orderSnap.data();

    // Verifica se o pedido pertence ao usuário logado
    if (order.userId && order.userId !== req.user.uid) {
        return res.status(403).json({ error: "Acesso negado a este pedido." });
    }

    // 1. Atualiza o status
    await orderRef.update({ status });

    // 2. INTEGRAÇÃO FINANCEIRA
    const transactionsRef = db.collection(COLL.TRANSACTIONS);
    const statusLimpo = status.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const pedidoFinalizado = ['concluido', 'entregue', 'finalizado'].includes(statusLimpo);

    if (pedidoFinalizado) {
      const existing = await transactionsRef.where('orderId', '==', id).get();

      if (existing.empty) {
        const valorSeguro = parseMoney(order.total);
        if (valorSeguro > 0) {
          await transactionsRef.add({
            userId: req.user.uid, // 🔒 Importante: Transação nasce com dono
            orderId: id,
            description: `Venda - Pedido #${id.substring(0, 5).toUpperCase()} - ${order.customerName || 'Cliente'}`,
            amount: valorSeguro,
            type: 'receita',
            category: 'Vendas',
            date: admin.firestore.Timestamp.now(),
            paymentMethod: 'Pix'
          });
        }
      }
    }
    // Lógica de estorno (remoção da transação)
    else {
      const existing = await transactionsRef.where('orderId', '==', id).get();
      if (!existing.empty) {
        const batch = db.batch();
        existing.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }
    }

    res.json({ id, status });
  } catch (error) {
    console.error("[ERRO FATAL]", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

// --- CONFIG ---
app.post('/admin/config', async (req, res) => {
    // Config agora é um documento dentro da coleção 'configs' com ID = userId
    await db.collection('configs').doc(req.user.uid).set(req.body, { merge: true });
    res.json(req.body);
});
app.get('/admin/config', async (req, res) => {
    const doc = await db.collection('configs').doc(req.user.uid).get();
    res.json(doc.exists ? doc.data() : {});
});

// --- DASHBOARD INTELIGENTE (SCOPED) ---
app.get('/admin/dashboard-stats', async (req, res) => {
  try {
    // Busca APENAS transações do usuário
    const s = await db.collection(COLL.TRANSACTIONS).where('userId', '==', req.user.uid).get();
    const p = await db.collection(COLL.PRODUCTS)
        .where('userId', '==', req.user.uid)
        .where('status', '==', 'ativo').count().get();

    let totalVendas = 0, totalDespesas = 0;

    s.docs.forEach(d => {
      const val = parseFloat(d.data().amount) || 0;
      const tipo = d.data().type;
      if (tipo === 'receita' || tipo === 'venda') {
        totalVendas += val;
      } else {
        totalDespesas += Math.abs(val);
      }
    });

    res.json({
      totalVendas,
      totalDespesas,
      lucroLiquido: totalVendas - totalDespesas,
      saldoTotal: totalVendas - totalDespesas,
      activeProducts: p.data().count
    });
  } catch (e) {
    res.json({ totalVendas: 0, totalDespesas: 0, lucroLiquido: 0, activeProducts: 0 });
  }
});

app.get('/admin/dashboard-charts', async (req, res) => {
  try {
    const s = await db.collection(COLL.TRANSACTIONS)
        .where('userId', '==', req.user.uid)
        .orderBy('date', 'asc').get();
        
    const salesMap = {}, expenseMap = {};

    s.docs.forEach(doc => {
      const d = doc.data();
      const val = parseFloat(d.amount) || 0;
      const dateObj = d.date.toDate ? d.date.toDate() : new Date(d.date);
      const dateLabel = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;

      if (d.type === 'receita' || d.type === 'venda') {
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

// ============================================================================
// GESTÃO DE ESTOQUE AVANÇADA (SCOPED)
// ============================================================================

app.post('/admin/inventory/adjust', async (req, res) => {
  const { productId, type, quantity, reason, userName } = req.body;

  if (!productId || !quantity || !type) return res.status(400).json({ error: "Dados incompletos" });

  try {
    const productRef = db.collection(COLL.PRODUCTS).doc(productId);
    const logsRef = db.collection('inventory_logs');

    await db.runTransaction(async (t) => {
      const doc = await t.get(productRef);
      // Verifica existência E propriedade
      if (!doc.exists) throw new Error("Produto não encontrado");
      if (doc.data().userId !== req.user.uid) throw new Error("Acesso negado");

      const currentQty = doc.data().quantity || 0;
      const adjustQty = parseInt(quantity);
      let newQty = currentQty;
      let change = 0;

      if (type === 'entry') { change = adjustQty; newQty += adjustQty; } 
      else if (type === 'exit' || type === 'loss') { change = -adjustQty; newQty -= adjustQty; }

      t.update(productRef, { quantity: newQty });

      t.set(logsRef.doc(), {
        userId: req.user.uid, // Log com dono
        productId,
        productName: doc.data().name,
        type, change, oldQuantity: currentQty, newQuantity: newQty,
        reason: reason || 'Ajuste manual',
        user: userName || 'Admin',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/admin/inventory/logs/:productId', async (req, res) => {
  try {
    // Verifica primeiro se o produto é do usuário
    const prod = await db.collection(COLL.PRODUCTS).doc(req.params.productId).get();
    if(!prod.exists || prod.data().userId !== req.user.uid) {
        return res.status(403).json({error: 'Produto inválido'});
    }

    const s = await db.collection('inventory_logs')
      .where('productId', '==', req.params.productId)
      .where('userId', '==', req.user.uid) // Segurança redundante
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const logs = s.docs.map(d => {
      const data = d.data();
      return {
        id: d.id, ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
      };
    });
    res.json(logs);
  } catch (e) {
    res.status(500).json({ error: "Erro interno ao buscar logs" });
  }
});

// ============================================================================
// MOTOR DE CAMPANHAS (SCOPED)
// ============================================================================
const chunkArray = (array, size) => {
  const chunked = [];
  for (let i = 0; i < array.length; i += size) chunked.push(array.slice(i, i + size));
  return chunked;
};

// 1. SIMULADOR SCOPED
app.post('/admin/campaign/simulate', async (req, res) => {
  try {
    const { discountPercent, minMarkup } = req.body;
    
    // Busca APENAS produtos do usuário
    const snapshot = await db.collection(COLL.PRODUCTS)
        .where('userId', '==', req.user.uid)
        .where('status', '==', 'ativo').get();
        
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    let stats = {
      totalProducts: products.length,
      affectedProducts: 0, skippedProducts: 0,
      currentRevenue: 0, projectedRevenue: 0,
      currentProfit: 0, projectedProfit: 0,
      totalCost: 0
    };

    products.forEach(p => {
        const cost = parseFloat(p.costPrice || 0);
        const currentPrice = parseFloat(p.salePrice || 0);
        const stock = parseInt(p.quantity || 0);

        stats.totalCost += (cost * stock);
        stats.currentRevenue += (currentPrice * stock);
        stats.currentProfit += ((currentPrice - cost) * stock);

        let newPrice = currentPrice * (1 - (discountPercent / 100));
        const minSafePrice = cost * (minMarkup || 1.0); 
        
        if (newPrice < minSafePrice && cost > 0) {
            newPrice = minSafePrice;
            stats.skippedProducts++;
        } else {
            stats.affectedProducts++;
        }
        if (cost === 0) newPrice = currentPrice * (1 - (discountPercent / 100));

        stats.projectedRevenue += (newPrice * stock);
        stats.projectedProfit += ((newPrice - cost) * stock);
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Erro ao simular campanha." });
  }
});

// 2. APLICAR CAMPANHA SCOPED
app.post('/admin/campaign/apply', async (req, res) => {
  try {
    const { discountPercent, minMarkup, campaignName } = req.body;
    
    // Busca APENAS produtos do usuário
    const snapshot = await db.collection(COLL.PRODUCTS)
        .where('userId', '==', req.user.uid)
        .where('status', '==', 'ativo').get();
        
    const products = snapshot.docs;
    const batches = chunkArray(products, 400);
    let updatedCount = 0;

    for (const batchDocs of batches) {
        const batch = db.batch();
        batchDocs.forEach(doc => {
            const p = doc.data();
            const cost = parseFloat(p.costPrice || 0);
            const currentPrice = parseFloat(p.salePrice || 0);
            let newPrice = currentPrice * (1 - (discountPercent / 100));
            
            const minSafePrice = cost * (minMarkup || 1.0);
            if (newPrice < minSafePrice && cost > 0) { newPrice = minSafePrice; }

            batch.update(doc.ref, {
                promotionalPrice: parseFloat(newPrice.toFixed(2)),
                isOnSale: true,
                campaignName: campaignName || 'Oferta Especial',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            updatedCount++;
        });
        await batch.commit();
    }
    res.json({ success: true, message: `${updatedCount} produtos atualizados.` });
  } catch (error) { res.status(500).json({ error: "Erro ao aplicar." }); }
});

// 3. REVERTER CAMPANHA SCOPED
app.post('/admin/campaign/revert', async (req, res) => {
  try {
    const snapshot = await db.collection(COLL.PRODUCTS)
        .where('userId', '==', req.user.uid) // Filtro de segurança
        .where('isOnSale', '==', true).get();
    
    if (snapshot.empty) return res.json({ success: true, message: "Nada a reverter." });

    const batches = chunkArray(snapshot.docs, 400);
    let revertedCount = 0;

    for (const batchDocs of batches) {
        const batch = db.batch();
        batchDocs.forEach(doc => {
            batch.update(doc.ref, {
                promotionalPrice: admin.firestore.FieldValue.delete(),
                isOnSale: false,
                campaignName: admin.firestore.FieldValue.delete(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            revertedCount++;
        });
        await batch.commit();
    }
    res.json({ success: true, message: `${revertedCount} produtos revertidos.` });
  } catch (error) { res.status(500).json({ error: "Erro ao reverter." }); }
});

// Para rodar localmente
if (process.env.VERCEL_ENV !== 'production') {
  app.listen(PORT, () => console.log(`🚀 API SaaS Multi-Tenant rodando na porta ${PORT}`));
}

module.exports = app;