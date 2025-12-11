const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const PORT = 3001;

// ============================================================================
// 1. CONFIGURAÇÕES INICIAIS (CORS & FIREBASE)
// ============================================================================

// Configuração de CORS (Permite acesso dos frontends)
const allowedOrigins = [
  'https://hiveerp-catalogo.vercel.app',
  'https://hive-erp.vercel.app',
  // Regex para permitir deploy previews da Vercel
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
app.use(express.json({ limit: '10mb' }));

// Inicialização do Firebase (Suporta Local e Vercel)
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

// Nomes das Coleções
const CONFIG_PATH = db.collection('config').doc('settings');
const PRODUCTS_COLLECTION = 'products';
const SUPPLIERS_COLLECTION = 'suppliers';
const TRANSACTIONS_COLLECTION = 'transactions';
const CATEGORIES_COLLECTION = 'categories';
const ORDERS_COLLECTION = 'orders';
const COUPONS_COLLECTION = 'coupons';

// ============================================================================
// 2. ROTAS PÚBLICAS (Catálogo & Configuração)
// ============================================================================

// Listar Produtos do Catálogo (Apenas Ativos)
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

// Configuração Pública (White-Label)
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

// Categorias Públicas
app.get('/categories-public', async (req, res) => {
  try {
    const snapshot = await db.collection(PRODUCTS_COLLECTION).where('status', '==', 'ativo').get();
    const categorySet = new Set();
    snapshot.docs.forEach(doc => {
      if (doc.data().category) categorySet.add(doc.data().category);
    });
    res.status(200).json(Array.from(categorySet).sort());
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar categorias." });
  }
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
      financeiroRegistrado: false, // Flag para controle
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // NOTA: Stock é baixado apenas quando o status muda para 'Enviado' ou pode ser aqui.
    // Neste sistema, optamos por baixar stock na confirmação (via Admin) ou aqui.
    // Vamos manter simples: Baixa aqui para garantir reserva.

    const batch = db.batch();
    const docRef = db.collection(ORDERS_COLLECTION).doc();
    batch.set(docRef, novoPedido);

    // Baixa de Stock Imediata ao criar pedido (Reserva)
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

// Validar Cupão
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
// 3. MIDDLEWARE DE SEGURANÇA (Para Rotas Admin)
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
// 4. ROTAS ADMIN (Protegidas)
// ============================================================================

// --- Produtos ---
app.get('/admin/produtos', async (req, res) => {
  const s = await db.collection(PRODUCTS_COLLECTION).get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
});

app.post('/admin/produtos', async (req, res) => {
  const ref = await db.collection(PRODUCTS_COLLECTION).add(req.body);
  res.status(201).json({ id: ref.id, ...req.body });
});

app.put('/admin/produtos/:id', async (req, res) => {
  await db.collection(PRODUCTS_COLLECTION).doc(req.params.id).update(req.body);
  res.json({ id: req.params.id, ...req.body });
});

app.delete('/admin/produtos/:id', async (req, res) => {
  await db.collection(PRODUCTS_COLLECTION).doc(req.params.id).delete();
  res.status(204).send();
});

// --- Fornecedores ---
app.get('/admin/fornecedores', async (req, res) => {
  const s = await db.collection(SUPPLIERS_COLLECTION).get();
  res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
});
app.post('/admin/fornecedores', async (req, res) => {
  const ref = await db.collection(SUPPLIERS_COLLECTION).add(req.body);
  res.status(201).json({ id: ref.id, ...req.body });
});
app.put('/admin/fornecedores/:id', async (req, res) => {
  await db.collection(SUPPLIERS_COLLECTION).doc(req.params.id).update(req.body);
  res.json({ id: req.params.id, ...req.body });
});
app.delete('/admin/fornecedores/:id', async (req, res) => {
  await db.collection(SUPPLIERS_COLLECTION).doc(req.params.id).delete();
  res.status(204).send();
});

// --- Financeiro ---
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
      return res.status(200).json({
        totalVendas: 0,
        totalDespesas: 0,
        lucroLiquido: 0,
        saldoTotal: 0
      });
    }

    const stats = snapshot.docs.reduce((acc, doc) => {
      const data = doc.data();
      let amount = parseFloat(data.amount);

      // Proteção: Se não for número, ignora
      if (isNaN(amount)) amount = 0;

      // Lógica Inteligente:
      // Se for 'despesa' e o valor estiver positivo no banco, invertemos para negativo.
      // Se já estiver negativo (novo padrão), mantemos negativo.
      let realAmount = amount;
      if (data.type === 'despesa' && amount > 0) {
        realAmount = -amount;
      }

      // 1. Acumula no Saldo Total (Vendas + Despesas Negativas)
      acc.saldoTotal += realAmount;

      // 2. Separa para os KPIs individuais
      if (data.type === 'venda') {
        acc.totalVendas += realAmount;
      } else if (data.type === 'despesa') {
        // Para mostrar no card de "Despesas", queremos o valor absoluto (positivo)
        acc.totalDespesas += Math.abs(realAmount);
      }

      return acc;
    }, { totalVendas: 0, totalDespesas: 0, saldoTotal: 0 });

    //O Lucro Líquido é matematicamente igual ao Saldo Total neste contexto
    const responseData = {
      totalVendas: stats.totalVendas,
      totalDespesas: stats.totalDespesas,
      lucroLiquido: stats.saldoTotal,
      saldoTotal: stats.saldoTotal
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error("ERRO em /admin/dashboard-stats:", error);
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});

// --- Dashboard Charts (Graficos) ---
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

// --- Configuração ---
app.get('/admin/config', async (req, res) => {
  const doc = await CONFIG_PATH.get();
  res.json(doc.exists ? doc.data() : {});
});
app.post('/admin/config', async (req, res) => {
  await CONFIG_PATH.set(req.body, { merge: true });
  res.json(req.body);
});

// --- Categorias ---
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

// --- Cupões ---
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

// --- Pedidos (Com Lógica Inteligente de Stock) ---
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

    // 3. Venda Confirmada (Enviado): Lança no Financeiro
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

// --- Relatório ABC ---
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

// --- ROTA: IMPORTAÇÃO EM MASSA (Smart Paste) ---
app.post('/admin/products/bulk', async (req, res) => {
  console.log("ROTA: POST /admin/products/bulk");
  try {
    const products = req.body; // Recebe um array de produtos

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Nenhum produto enviado." });
    }

    // O Firestore permite gravar até 500 documentos por lote (batch)
    const batch = db.batch();
    
    // Configurações padrão para calcular preços se não vierem
    // (Num cenário ideal, leríamos do config, mas aqui usamos defaults seguros)
    const MARKUP_PADRAO = 2.0; 

    products.forEach(prod => {
      const docRef = db.collection(PRODUCTS_COLLECTION).doc();
      
      // Sanitização e Cálculos Automáticos
      const custo = parseFloat(prod.costPrice) || 0;
      let venda = parseFloat(prod.salePrice);
      
      // Se não enviou preço de venda, calcula automático
      if (!venda || venda <= custo) {
         venda = custo * MARKUP_PADRAO;
      }

      // Gera SKU se não tiver
      let code = prod.code;
      if (!code) {
         const random = Math.floor(1000 + Math.random() * 9000);
         const nomePart = prod.name ? prod.name.substring(0, 3).toUpperCase() : 'PRO';
         code = `${nomePart}-${random}`;
      }

      const newProduct = {
        name: prod.name || 'Produto Sem Nome',
        costPrice: custo,
        salePrice: venda,
        quantity: parseInt(prod.quantity) || 0,
        code: code,
        category: prod.category || 'Geral',
        description: prod.description || '',
        supplierProductUrl: prod.supplierProductUrl || '',
        imageUrl: prod.imageUrl || '',
        status: 'ativo',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      batch.set(docRef, newProduct);
    });

    await batch.commit();
    
    console.log(`Sucesso: ${products.length} produtos importados.`);
    res.status(201).json({ message: "Importação concluída!", count: products.length });

  } catch (error) {
    console.error("ERRO na Importação:", error);
    res.status(500).json({ message: "Erro ao importar.", error: error.message });
  }
});
module.exports = app;