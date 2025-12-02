const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const PORT = 3001;

// --- CONFIGURAÇÃO DE CORS ---
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
      console.error(`Origem REJEITADA pelo CORS: ${origin}`);
      callback(new Error('Não permitido pelo CORS'));
    }
  }
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// --- INICIALIZAÇÃO DO FIREBASE ---
let serviceAccount;
if (process.env.VERCEL_ENV === 'production') {
  console.log("A rodar na Vercel. A ler SERVICE_ACCOUNT_KEY...");
  if (!process.env.SERVICE_ACCOUNT_KEY) {
    console.error("ERRO CRÍTICO: Variável de Ambiente SERVICE_ACCOUNT_KEY não definida na Vercel.");
    process.exit(1);
  }
  try {
    serviceAccount = JSON.parse(Buffer.from(process.env.SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8'));
  } catch (e) {
    console.error("Erro ao fazer parse da SERVICE_ACCOUNT_KEY JSON:", e.message);
    process.exit(1);
  }
} else {
  console.log("A rodar localmente. A ler serviceAccountKey.json...");
  try {
    serviceAccount = require('./serviceAccountKey.json');
  } catch (error) {
    console.error("ERRO CRÍTICO: Não foi possível encontrar 'serviceAccountKey.json'.");
    process.exit(1);
  }
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin inicializado com SUCESSO.");
  } catch (error) {
    console.error("ERRO CRÍTICO: Falha ao inicializar o Firebase Admin.");
    console.error(error);
    process.exit(1);
  }
}

const db = admin.firestore();
const CONFIG_PATH = db.collection('config').doc('settings');
const PRODUCTS_COLLECTION = 'products';
const SUPPLIERS_COLLECTION = 'suppliers';
const TRANSACTIONS_COLLECTION = 'transactions';
const CATEGORIES_COLLECTION = 'categories';
const ORDERS_COLLECTION = 'orders';
const COUPONS_COLLECTION = 'coupons';

// --- 1. MIDDLEWARE DE SEGURANÇA (O GUARDA-COSTAS) ---
const authenticateUser = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Não autorizado. Token em falta.' });
  }

  const token = header.split(' ')[1];

  try {
    // Verifica se o token é válido e foi emitido pelo Firebase
    await admin.auth().verifyIdToken(token);
    next(); // Tudo certo, pode passar!
  } catch (error) {
    console.error('Erro de autenticação:', error);
    res.status(403).json({ message: 'Token inválido ou expirado.' });
  }
};


// ============================================================================
// MÓDULO: CATÁLOGO PÚBLICO (Acesso Livre)
// ============================================================================
// Estas rotas ficam ANTES do middleware de segurança

app.get('/produtos-catalogo', async (req, res) => {
  console.log("ROTA: GET /produtos-catalogo");
  try {
    const snapshot = await db.collection(PRODUCTS_COLLECTION)
      .where('status', '==', 'ativo')
      .get();
    if (snapshot.empty) return res.status(200).json([]);

    const produtos = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Nome Indisponível',
        imageUrl: data.imageUrl || null,
        code: data.code || 'N/A',
        category: data.category || 'Sem Categoria',
        description: data.description || '',
        salePrice: data.salePrice || 0,
        status: data.status || 'ativo',
        quantity: data.quantity !== undefined ? data.quantity : 0
      };
    });
    res.status(200).json(produtos);
  } catch (error) {
    console.error("ERRO em /produtos-catalogo:", error.message);
    res.status(500).json({ message: "Erro interno", error: error.message });
  }
});

app.get('/config-publica', async (req, res) => {
  console.log("ROTA: GET /config-publica");
  try {
    const doc = await CONFIG_PATH.get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Configuração não encontrada." });
    }
    const settings = doc.data();
    const configPublica = {
      whatsappNumber: settings.whatsappNumber || null
    };
    res.status(200).json(configPublica);
  } catch (error) {
    console.error("ERRO em /config-publica:", error.message);
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});

app.get('/categories-public', async (req, res) => {
  console.log("ROTA: GET /categories-public");
  try {
    const snapshot = await db.collection(PRODUCTS_COLLECTION)
      .where('status', '==', 'ativo')
      .get();

    if (snapshot.empty) return res.status(200).json([]);

    const categorySet = new Set();
    snapshot.docs.forEach(doc => {
      const category = doc.data().category;
      if (category) {
        categorySet.add(category);
      }
    });

    const categories = Array.from(categorySet).sort();
    res.status(200).json(categories);

  } catch (error) {
    console.error("ERRO em /categories-public:", error.message);
    res.status(500).json({ message: "Erro interno", error: error.message });
  }
});

app.post('/orders', async (req, res) => {
  console.log("ROTA: POST /orders (Novo Pedido do Catálogo)");
  try {
    const pedidoData = req.body;

    if (!pedidoData || !pedidoData.items || pedidoData.items.length === 0 || !pedidoData.total) {
      return res.status(400).json({ message: "Dados do pedido incompletos." });
    }

    const novoPedido = {
      ...pedidoData,
      status: 'Aguardando Pagamento',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection(ORDERS_COLLECTION).add(novoPedido);
    res.status(201).json({ id: docRef.id, ...novoPedido });

  } catch (error) {
    console.error("ERRO em POST /orders:", error.message);
    res.status(500).json({ message: "Erro ao registrar pedido.", error: error.message });
  }
});


// ============================================================================
// MÓDULO: ADMIN (Acesso Restrito)
// ============================================================================

// --- 2. APLICAR O GUARDA-COSTAS AQUI ---
// Todas as rotas abaixo desta linha exigem Token de Admin
app.use('/admin', authenticateUser);


// --- ROTAS DE PRODUTOS (ADMIN) ---
app.get('/admin/produtos', async (req, res) => {
  console.log("ROTA: GET /admin/produtos");
  try {
    const snapshot = await db.collection(PRODUCTS_COLLECTION).get();
    if (snapshot.empty) return res.status(200).json([]);
    const produtos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(produtos);
  } catch (error) {
    console.error("ERRO em /admin/produtos:", error.message);
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});

app.post('/admin/produtos', async (req, res) => {
  console.log("ROTA: POST /admin/produtos");
  try {
    const novoProduto = req.body;
    if (!novoProduto || !novoProduto.name || !novoProduto.costPrice || !novoProduto.salePrice) {
      return res.status(400).json({ message: "Dados do produto em falta." });
    }
    const docRef = await db.collection(PRODUCTS_COLLECTION).add(novoProduto);
    res.status(201).json({ id: docRef.id, ...novoProduto });
  } catch (error) {
    console.error("ERRO em POST /admin/produtos:", error.message);
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});

app.put('/admin/produtos/:id', async (req, res) => {
  console.log(`ROTA: PUT /admin/produtos/${req.params.id}`);
  try {
    const { id } = req.params;
    const dadosAtualizados = req.body;
    if (!id) return res.status(400).json({ message: "ID em falta." });
    await db.collection(PRODUCTS_COLLECTION).doc(id).update(dadosAtualizados);
    res.status(200).json({ id: id, ...dadosAtualizados });
  } catch (error) {
    console.error(`ERRO em PUT /admin/produtos/${req.params.id}:`, error.message);
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});

app.delete('/admin/produtos/:id', async (req, res) => {
  console.log(`ROTA: DELETE /admin/produtos/${req.params.id}`);
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "ID em falta." });
    await db.collection(PRODUCTS_COLLECTION).doc(id).delete();
    res.status(204).send();
  } catch (error) {
    console.error(`ERRO em DELETE /admin/produtos/${req.params.id}:`, error.message);
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});


// --- ROTAS DE FORNECEDORES (ADMIN) ---
app.get('/admin/fornecedores', async (req, res) => {
  try {
    const snapshot = await db.collection(SUPPLIERS_COLLECTION).get();
    if (snapshot.empty) return res.status(200).json([]);
    const fornecedores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(fornecedores);
  } catch (error) {
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});
app.post('/admin/fornecedores', async (req, res) => {
  try {
    const novoFornecedor = req.body;
    const docRef = await db.collection(SUPPLIERS_COLLECTION).add(novoFornecedor);
    res.status(201).json({ id: docRef.id, ...novoFornecedor });
  } catch (error) {
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});
app.put('/admin/fornecedores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dadosAtualizados = req.body;
    await db.collection(SUPPLIERS_COLLECTION).doc(id).update(dadosAtualizados);
    res.status(200).json({ id: id, ...dadosAtualizados });
  } catch (error) {
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});
app.delete('/admin/fornecedores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection(SUPPLIERS_COLLECTION).doc(id).delete();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});

// --- ROTAS DE FINANCEIRO (ADMIN) ---
app.get('/admin/transacoes', async (req, res) => {
  try {
    const snapshot = await db.collection(TRANSACTIONS_COLLECTION).orderBy('date', 'desc').get();
    if (snapshot.empty) return res.status(200).json([]);
    const transacoes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(transacoes);
  } catch (error) {
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});
app.post('/admin/transacoes', async (req, res) => {
  try {
    const novaTransacao = req.body;
    novaTransacao.amount = parseFloat(novaTransacao.amount);
    novaTransacao.date = admin.firestore.Timestamp.fromDate(new Date(novaTransacao.date));
    const docRef = await db.collection(TRANSACTIONS_COLLECTION).add(novaTransacao);
    res.status(201).json({ id: docRef.id, ...novaTransacao });
  } catch (error) {
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});
app.put('/admin/transacoes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dadosAtualizados = req.body;
    dadosAtualizados.amount = parseFloat(dadosAtualizados.amount);
    dadosAtualizados.date = admin.firestore.Timestamp.fromDate(new Date(dadosAtualizados.date));
    await db.collection(TRANSACTIONS_COLLECTION).doc(id).update(dadosAtualizados);
    res.status(200).json({ id: id, ...dadosAtualizados });
  } catch (error) {
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});
app.delete('/admin/transacoes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection(TRANSACTIONS_COLLECTION).doc(id).delete();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});

// --- ROTA DO DASHBOARD (ADMIN) ---
app.get('/admin/dashboard-stats', async (req, res) => {
  try {
    const snapshot = await db.collection(TRANSACTIONS_COLLECTION).get();
    if (snapshot.empty) {
      return res.status(200).json({ totalVendas: 0, totalDespesas: 0, lucroLiquido: 0, saldoTotal: 0 });
    }
    const stats = snapshot.docs.reduce((acc, doc) => {
      const transacao = doc.data();
      const amount = transacao.amount || 0;
      acc.saldoTotal += amount;
      if (transacao.type === 'venda') {
        acc.totalVendas += amount;
      } else if (transacao.type === 'despesa') {
        acc.totalDespesas += amount;
      }
      return acc;
    }, { totalVendas: 0, totalDespesas: 0, lucroLiquido: 0, saldoTotal: 0 });
    stats.lucroLiquido = stats.totalVendas + stats.totalDespesas;
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});

// --- ROTAS DE CONFIGURAÇÃO (ADMIN) ---
app.get('/admin/config', async (req, res) => {
  try {
    const doc = await CONFIG_PATH.get();
    if (!doc.exists) return res.status(200).json({});
    res.status(200).json(doc.data());
  } catch (error) {
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});
app.post('/admin/config', async (req, res) => {
  try {
    const novasConfiguracoes = req.body;
    await CONFIG_PATH.set(novasConfiguracoes, { merge: true });
    res.status(200).json(novasConfiguracoes);
  } catch (error) {
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});

// --- ROTAS DE CATEGORIAS (ADMIN) ---
app.get('/admin/categories', async (req, res) => {
  try {
    const snapshot = await db.collection(CATEGORIES_COLLECTION).orderBy('name').get();
    if (snapshot.empty) return res.status(200).json([]);
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});

app.post('/admin/categories', async (req, res) => {
  try {
    const newCategory = req.body;
    const existingSnapshot = await db.collection(CATEGORIES_COLLECTION)
      .where('name', '==', newCategory.name)
      .get();
    if (!existingSnapshot.empty) {
      return res.status(400).json({ message: "Essa categoria já existe." });
    }
    const docRef = await db.collection(CATEGORIES_COLLECTION).add(newCategory);
    res.status(201).json({ id: docRef.id, ...newCategory });
  } catch (error) {
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});

app.delete('/admin/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const categoryDoc = await db.collection(CATEGORIES_COLLECTION).doc(id).get();
    if (!categoryDoc.exists) {
      return res.status(404).json({ message: "Categoria não encontrada." });
    }
    const categoryName = categoryDoc.data().name;
    const productsSnapshot = await db.collection(PRODUCTS_COLLECTION)
      .where('category', '==', categoryName)
      .limit(1)
      .get();

    if (!productsSnapshot.empty) {
      return res.status(400).json({
        message: `A categoria "${categoryName}" está em uso por um ou mais produtos.`
      });
    }
    await db.collection(CATEGORIES_COLLECTION).doc(id).delete();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});

// --- ROTAS DE PEDIDOS (ADMIN) ---
app.get('/admin/orders', async (req, res) => {
  try {
    const snapshot = await db.collection(ORDERS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();
    if (snapshot.empty) return res.status(200).json([]);
    const pedidos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(pedidos);
  } catch (error) {
    res.status(500).json({ message: "Erro interno ao buscar pedidos.", error: error.message });
  }
});

app.put('/admin/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const docRef = db.collection(ORDERS_COLLECTION).doc(id);

    const pedidoDoc = await docRef.get();
    if (!pedidoDoc.exists) {
      return res.status(404).json({ message: "Pedido não encontrado." });
    }
    const pedidoData = pedidoDoc.data();

    const updateData = { status: status };

    if (status === 'Enviado' && !pedidoData.financeiroRegistrado) {
      console.log(`Sincronia Financeira: Registrando venda para o pedido #${id}`);

      const novaTransacao = {
        type: 'venda',
        amount: pedidoData.total,
        description: `Venda do Pedido #${id.substring(0, 5).toUpperCase()}`,
        date: admin.firestore.Timestamp.now()
      };

      await db.collection(TRANSACTIONS_COLLECTION).add(novaTransacao);

      // Baixa de Stock
      if (pedidoData.items && Array.isArray(pedidoData.items)) {
        const batch = db.batch();
        for (const item of pedidoData.items) {
          if (item.id) {
            const produtoRef = db.collection(PRODUCTS_COLLECTION).doc(item.id);
            batch.update(produtoRef, {
              quantity: admin.firestore.FieldValue.increment(-item.quantidade)
            });
          }
        }
        await batch.commit();
      }

      updateData.financeiroRegistrado = true;
    }

    await docRef.update(updateData);
    const pedidoAtualizado = await docRef.get();
    res.status(200).json({ id: pedidoAtualizado.id, ...pedidoAtualizado.data() });

  } catch (error) {
    console.error(`ERRO em PUT /admin/orders/${req.params.id}:`, error.message);
    res.status(500).json({ message: "Erro ao atualizar status.", error: error.message });
  }
});

// --- 8. INICIALIZAÇÃO DO SERVIDOR ---
if (process.env.VERCEL_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`[API] Backend rodando em http://localhost:${PORT}`);
  });
}
// --- ROTA DE DADOS PARA GRÁFICOS (NOVA) ---
app.get('/admin/dashboard-charts', async (req, res) => {
  console.log("ROTA: GET /admin/dashboard-charts");
  try {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const snapshot = await db.collection(TRANSACTIONS_COLLECTION).get();

    if (snapshot.empty) {
      return res.status(200).json({ salesByDay: [], incomeVsExpense: [] });
    }

    // 1. Preparar estrutura para os últimos 7 dias
    const last7Days = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dayStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      last7Days[dayStr] = 0;
    }

    let totalIncome = 0;
    let totalExpense = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const date = data.date.toDate(); // Converte Timestamp do Firestore para Date JS
      const amount = parseFloat(data.amount);

      // Lógica para Gráfico de Pizza (Total)
      if (data.type === 'venda' || data.type === 'capital') {
        totalIncome += amount;
      } else if (data.type === 'despesa') {
        totalExpense += Math.abs(amount);
      }

      // Lógica para Gráfico de Barras (Últimos 7 dias - Apenas Vendas)
      if (data.type === 'venda' && date >= sevenDaysAgo) {
        const dayStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (last7Days[dayStr] !== undefined) {
          last7Days[dayStr] += amount;
        }
      }
    });

    // Formatar para o Recharts
    const salesByDay = Object.keys(last7Days).map(key => ({
      name: key,
      vendas: last7Days[key]
    }));

    const incomeVsExpense = [
      { name: 'Receitas', value: totalIncome },
      { name: 'Despesas', value: totalExpense }
    ];

    res.status(200).json({ salesByDay, incomeVsExpense });

  } catch (error) {
    console.error("ERRO em /admin/dashboard-charts:", error.message);
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});

app.get('/config-publica', async (req, res) => {
  console.log("ROTA: GET /config-publica");
  try {
    const doc = await CONFIG_PATH.get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Configuração não encontrada." });
    }
    const settings = doc.data();

    // --- ATUALIZADO PARA ENVIAR DADOS VISUAIS ---
    const configPublica = {
      whatsappNumber: settings.whatsappNumber || null,
      storeName: settings.storeName || "HivePratas",
      primaryColor: settings.primaryColor || "#D4AF37",    // Dourado Default
      secondaryColor: settings.secondaryColor || "#343434" // Carvão Default
    };
    // -------------------------------------------

    res.status(200).json(configPublica);
  } catch (error) {
    console.error("ERRO em /config-publica:", error.message);
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});

// --- ROTA PÚBLICA: VALIDAR Cupons ---
app.post('/validate-coupon', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "Código obrigatório." });

    const snapshot = await db.collection(COUPONS_COLLECTION)
      .where('code', '==', code.toUpperCase()) // Case insensitive
      .where('status', '==', 'ativo')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ message: "Cupão inválido ou expirado." });
    }

    const coupon = snapshot.docs[0].data();
    res.status(200).json({
      code: coupon.code,
      discountPercent: coupon.discountPercent
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao validar cupão." });
  }
});

// --- ROTAS DE CUPÕES (ADMIN) ---
app.get('/admin/coupons', async (req, res) => {
  try {
    const snapshot = await db.collection(COUPONS_COLLECTION).get();
    const coupons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar cupões." });
  }
});

app.post('/admin/coupons', async (req, res) => {
  try {
    const { code, discountPercent } = req.body;
    if (!code || !discountPercent) return res.status(400).json({ message: "Dados incompletos." });

    // Verifica duplicados
    const existing = await db.collection(COUPONS_COLLECTION).where('code', '==', code.toUpperCase()).get();
    if (!existing.empty) return res.status(400).json({ message: "Código já existe." });

    const newCoupon = {
      code: code.toUpperCase(),
      discountPercent: parseFloat(discountPercent),
      status: 'ativo',
      createdAt: admin.firestore.Timestamp.now()
    };

    const docRef = await db.collection(COUPONS_COLLECTION).add(newCoupon);
    res.status(201).json({ id: docRef.id, ...newCoupon });
  } catch (error) {
    res.status(500).json({ message: "Erro ao criar cupão." });
  }
});

app.delete('/admin/coupons/:id', async (req, res) => {
  try {
    await db.collection(COUPONS_COLLECTION).doc(req.params.id).delete();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Erro ao apagar." });
  }
});


// --- ROTA DE RELATÓRIOS (CURVA ABC) ---
app.get('/admin/reports/abc', async (req, res) => {
  console.log("ROTA: GET /admin/reports/abc");
  try {
    // 1. Buscar todos os produtos ativos
    const productsSnapshot = await db.collection(PRODUCTS_COLLECTION).where('status', '==', 'ativo').get();
    const productMap = {};

    productsSnapshot.forEach(doc => {
      const data = doc.data();
      productMap[doc.id] = {
        id: doc.id,
        name: data.name,
        imageUrl: data.imageUrl,
        stock: data.quantity || 0,
        revenue: 0,
        unitsSold: 0
      };
    });

    // 2. Buscar todos os pedidos (exceto cancelados)
    const ordersSnapshot = await db.collection(ORDERS_COLLECTION).where('status', '!=', 'Cancelado').get();

    // 3. Somar as vendas
    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (productMap[item.id]) {
            productMap[item.id].revenue += (item.salePrice * item.quantidade);
            productMap[item.id].unitsSold += item.quantidade;
          }
        });
      }
    });

    // 4. Transformar em array e ordenar por Receita (do maior para o menor)
    let report = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);

    // 5. Classificar A, B, C (Regra 20/30/50)
    const totalProducts = report.length;
    report = report.map((p, index) => {
      const percentile = (index + 1) / totalProducts;
      let classification = 'C';
      if (percentile <= 0.2) classification = 'A'; // Top 20%
      else if (percentile <= 0.5) classification = 'B'; // Próximos 30%

      // Se não vendeu nada, é automaticamente C
      if (p.revenue === 0) classification = 'C';

      return { ...p, classification };
    });

    res.status(200).json(report);

  } catch (error) {
    console.error("ERRO no Relatório ABC:", error.message);
    res.status(500).json({ message: "Erro ao gerar relatório." });
  }
});

module.exports = app;