const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// 1. Definição do 'app' logo no início
const app = express();
const PORT = 3001;

// --- 2. CONFIGURAÇÃO DE CORS (Whitelist) ---
const allowedOrigins = [
  'https://hiveerp-catalogo.vercel.app',
  'https://hive-erp.vercel.app',
  // Expressão Regular (RegExp) para todos os previews da Vercel
  /https:\/\/hiveerp-catalogo-.*\.vercel\.app$/,
  /https:\/\/hive-erp-.*\.vercel\.app$/,
  
  'http://localhost:5173', // app-admin local
  'http://localhost:5174'  // app-catalogo local
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Permite Postman, etc.

    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      }
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
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

// --- 3. CONFIGURAÇÃO DE MIDDLEWARE ---
app.use(cors(corsOptions));
// Apenas UMA chamada de express.json(), com o limite de 10mb
app.use(express.json({ limit: '10mb' }));

// --- 4. INICIALIZAÇÃO DA CHAVE FIREBASE ---
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

// --- 5. INICIALIZAÇÃO DO FIREBASE (CORRIGIDA PARA VERCEL) ---
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

// --- 6. CONSTANTES DO BANCO DE DADOS ---
const db = admin.firestore();
const CONFIG_PATH = db.collection('config').doc('settings');
const PRODUCTS_COLLECTION = 'products';
const SUPPLIERS_COLLECTION = 'suppliers';
const TRANSACTIONS_COLLECTION = 'transactions';
const CATEGORIES_COLLECTION = 'categories';
const ORDERS_COLLECTION = 'orders';


// ============================================================================
// MÓDULO: CATÁLOGO PÚBLICO (app-catalogo)
// ============================================================================

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
        quantity: data.quantity !== undefined ? data.quantity : 0 // <-- EXPOR A QUANTIDADE
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
      status: 'Aguardando Pagamento', // Status inicial
      createdAt: admin.firestore.FieldValue.serverTimestamp() // Data de criação
    };

    const docRef = await db.collection(ORDERS_COLLECTION).add(novoPedido);
    res.status(201).json({ id: docRef.id, ...novoPedido });

  } catch (error) {
    console.error("ERRO em POST /orders:", error.message);
    res.status(500).json({ message: "Erro ao registrar pedido.", error: error.message });
  }
});


// ============================================================================
// MÓDULO: ADMIN (app-admin)
// ============================================================================

/* --- ROTA: GEMINI NAMER (IA) - DESATIVADA ---
app.post('/admin/generate-name', async (req, res) => {
  // ... (código da IA comentado)
});
*/

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
      return res.status(400).json({ message: "Dados do produto em falta. Nome, Custo e Preço de Venda são obrigatórios." });
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
    if (!dadosAtualizados || !dadosAtualizados.name || !dadosAtualizados.costPrice || !dadosAtualizados.salePrice) {
      return res.status(400).json({ message: "Dados do produto em falta. Nome, Custo e Preço de Venda são obrigatórios." });
    }
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
  console.log("ROTA: GET /admin/fornecedores");
  try {
    const snapshot = await db.collection(SUPPLIERS_COLLECTION).get();
    if (snapshot.empty) return res.status(200).json([]);
    const fornecedores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(fornecedores);
  } catch (error) {
    console.error("ERRO em /admin/fornecedores:", error.message);
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});
app.post('/admin/fornecedores', async (req, res) => {
  console.log("ROTA: POST /admin/fornecedores");
  try {
    const novoFornecedor = req.body;
    if (!novoFornecedor || !novoFornecedor.name) {
      return res.status(400).json({ message: "O 'name' é obrigatório." });
    }
    const docRef = await db.collection(SUPPLIERS_COLLECTION).add(novoFornecedor);
    res.status(201).json({ id: docRef.id, ...novoFornecedor });
  } catch (error) {
    console.error("ERRO em POST /admin/fornecedores:", error.message);
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});
app.put('/admin/fornecedores/:id', async (req, res) => {
  console.log(`ROTA: PUT /admin/fornecedores/${req.params.id}`);
  try {
    const { id } = req.params;
    const dadosAtualizados = req.body;
    if (!id) return res.status(400).json({ message: "ID em falta." });
    if (!dadosAtualizados || !dadosAtualizados.name) {
      return res.status(400).json({ message: "O 'name' é obrigatório." });
    }
    await db.collection(SUPPLIERS_COLLECTION).doc(id).update(dadosAtualizados);
    res.status(200).json({ id: id, ...dadosAtualizados });
  } catch (error) {
    console.error(`ERRO em PUT /admin/fornecedores/${req.params.id}:`, error.message);
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});
app.delete('/admin/fornecedores/:id', async (req, res) => {
  console.log(`ROTA: DELETE /admin/fornecedores/${req.params.id}`);
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "ID em falta." });
    await db.collection(SUPPLIERS_COLLECTION).doc(id).delete();
    res.status(204).send();
  } catch (error) {
    console.error(`ERRO em DELETE /admin/fornecedores/${req.params.id}:`, error.message);
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});

// --- ROTAS DE FINANCEIRO (ADMIN) ---
app.get('/admin/transacoes', async (req, res) => {
  console.log("ROTA: GET /admin/transacoes");
  try {
    const snapshot = await db.collection(TRANSACTIONS_COLLECTION).orderBy('date', 'desc').get();
    if (snapshot.empty) return res.status(200).json([]);
    const transacoes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(transacoes);
  } catch (error) {
    console.error("ERRO em /admin/transacoes:", error.message);
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});
app.post('/admin/transacoes', async (req, res) => {
  console.log("ROTA: POST /admin/transacoes");
  try {
    const novaTransacao = req.body;
    if (!novaTransacao || !novaTransacao.type || !novaTransacao.amount || !novaTransacao.description || !novaTransacao.date) {
      return res.status(400).json({ message: "Dados da transação em falta." });
    }
    novaTransacao.amount = parseFloat(novaTransacao.amount);
    novaTransacao.date = admin.firestore.Timestamp.fromDate(new Date(novaTransacao.date));
    const docRef = await db.collection(TRANSACTIONS_COLLECTION).add(novaTransacao);
    res.status(201).json({ id: docRef.id, ...novaTransacao });
  } catch (error) {
    console.error("ERRO em POST /admin/transacoes:", error.message);
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});
app.put('/admin/transacoes/:id', async (req, res) => {
  console.log(`ROTA: PUT /admin/transacoes/${req.params.id}`);
  try {
    const { id } = req.params;
    const dadosAtualizados = req.body;
    if (!id) return res.status(400).json({ message: "ID em falta." });
    if (!dadosAtualizados.type || !dadosAtualizados.amount || !dadosAtualizados.description || !dadosAtualizados.date) {
      return res.status(400).json({ message: "Dados da transação em falta." });
    }
    dadosAtualizados.amount = parseFloat(dadosAtualizados.amount);
    dadosAtualizados.date = admin.firestore.Timestamp.fromDate(new Date(dadosAtualizados.date));
    await db.collection(TRANSACTIONS_COLLECTION).doc(id).update(dadosAtualizados);
    res.status(200).json({ id: id, ...dadosAtualizados });
  } catch (error) {
    console.error(`ERRO em PUT /admin/transacoes/${req.params.id}:`, error.message);
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});
app.delete('/admin/transacoes/:id', async (req, res) => {
  console.log(`ROTA: DELETE /admin/transacoes/${req.params.id}`);
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "ID em falta." });
    await db.collection(TRANSACTIONS_COLLECTION).doc(id).delete();
    res.status(204).send();
  } catch (error) {
    console.error(`ERRO em DELETE /admin/transacoes/${req.params.id}:`, error.message);
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});

// --- ROTA DO DASHBOARD (ADMIN) ---
app.get('/admin/dashboard-stats', async (req, res) => {
  console.log("ROTA: GET /admin/dashboard-stats");
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
    console.error("ERRO em /admin/dashboard-stats:", error.message);
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});

// --- ROTAS DE CONFIGURAÇÃO (ADMIN) ---
app.get('/admin/config', async (req, res) => {
  console.log("ROTA: GET /admin/config");
  try {
    const doc = await CONFIG_PATH.get();
    if (!doc.exists) return res.status(200).json({});
    res.status(200).json(doc.data());
  } catch (error) {
    console.error("ERRO em /admin/config:", error.message);
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});
app.post('/admin/config', async (req, res) => {
  console.log("ROTA: POST /admin/config");
  try {
    const novasConfiguracoes = req.body;
    await CONFIG_PATH.set(novasConfiguracoes, { merge: true });
    res.status(200).json(novasConfiguracoes);
  } catch (error) {
    console.error("ERRO em POST /admin/config:", error.message);
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});

// --- ROTAS DE CATEGORIAS (ADMIN) ---
app.get('/admin/categories', async (req, res) => {
  console.log("ROTA: GET /admin/categories");
  try {
    const snapshot = await db.collection(CATEGORIES_COLLECTION).orderBy('name').get();
    if (snapshot.empty) return res.status(200).json([]);
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(categories);
  } catch (error) {
    console.error("ERRO em /admin/categories:", error.message);
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});

app.post('/admin/categories', async (req, res) => {
  console.log("ROTA: POST /admin/categories");
  try {
    const newCategory = req.body;
    if (!newCategory || !newCategory.name) {
      return res.status(400).json({ message: "O 'name' é obrigatório." });
    }
    const existingSnapshot = await db.collection(CATEGORIES_COLLECTION)
      .where('name', '==', newCategory.name)
      .get();
    if (!existingSnapshot.empty) {
      return res.status(400).json({ message: "Essa categoria já existe." });
    }

    const docRef = await db.collection(CATEGORIES_COLLECTION).add(newCategory);
    res.status(201).json({ id: docRef.id, ...newCategory });
  } catch (error) {
    console.error("ERRO em POST /admin/categories:", error.message);
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});

// ROTA DE DELETE (CORRIGIDA - Bloco duplicado removido)
app.delete('/admin/categories/:id', async (req, res) => {
  console.log(`ROTA: DELETE /admin/categories/${req.params.id}`);
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "ID em falta." });

    // Validação
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
        message: `A categoria "${categoryName}" está em uso por um ou mais produtos e não pode ser apagada.`
      });
    }

    // Se estiver livre, apaga
    await db.collection(CATEGORIES_COLLECTION).doc(id).delete();
    res.status(204).send();
  } catch (error) {
    console.error(`ERRO em DELETE /admin/categories/${req.params.id}:`, error.message);
    res.status(500).json({ message: "Erro interno.", error: error.message });
  }
});


// --- ROTAS DE PEDIDOS (ADMIN) ---
app.get('/admin/orders', async (req, res) => {
  console.log("ROTA: GET /admin/orders");
  try {
    const snapshot = await db.collection(ORDERS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();
    if (snapshot.empty) return res.status(200).json([]);
    const pedidos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(pedidos);
  } catch (error) {
    console.error("ERRO em GET /admin/orders:", error.message);
    res.status(500).json({ message: "Erro interno ao buscar pedidos.", error: error.message });
  }
});

// ROTA PUT DE PEDIDOS (Corrigida, duplicada removida e sintaxe arranjada)
app.put('/admin/orders/:id', async (req, res) => {
  console.log(`ROTA: PUT /admin/orders/${req.params.id}`);
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ message: "ID do pedido ou novo status em falta." });
    }

    const docRef = db.collection(ORDERS_COLLECTION).doc(id);
    
    // Obter dados do pedido
    const pedidoDoc = await docRef.get();
    if (!pedidoDoc.exists) {
      return res.status(404).json({ message: "Pedido não encontrado." });
    }
    const pedidoData = pedidoDoc.data();
    
    const updateData = { status: status };

    // Lógica combinada: Financeiro + Stock
    if (status === 'Enviado' && !pedidoData.financeiroRegistrado) {
      console.log(`Processando envio para o pedido #${id}`);
      
      const batch = db.batch(); // Usar batch para operações atômicas

      // 1. Registar Transação Financeira
      const novaTransacaoRef = db.collection(TRANSACTIONS_COLLECTION).doc();
      batch.set(novaTransacaoRef, {
        type: 'venda',
        amount: pedidoData.total,
        description: `Venda do Pedido #${id.substring(0, 5).toUpperCase()}`,
        date: admin.firestore.Timestamp.now()
      });

      // 2. Dar Baixa no Stock
      if (pedidoData.items && Array.isArray(pedidoData.items)) {
        for (const item of pedidoData.items) {
          if (item.id) { // ID do produto
            const produtoRef = db.collection(PRODUCTS_COLLECTION).doc(item.id);
            // Decrementar a quantidade de forma atômica
            batch.update(produtoRef, {
              quantity: admin.firestore.FieldValue.increment(-item.quantidade)
            });
          }
        }
      }

      // 3. Atualizar o Pedido
      // Marcamos como 'financeiroRegistrado' (que agora significa 'processado completamente')
      updateData.financeiroRegistrado = true;
      batch.update(docRef, updateData);

      // Executar tudo junto
      await batch.commit();
      console.log("Batch de envio executado com sucesso.");
      
      // Retornar o pedido atualizado (temos que buscar de novo pois o batch não retorna dados)
      const pedidoFinal = await docRef.get();
      return res.status(200).json({ id: pedidoFinal.id, ...pedidoFinal.data() });
    }

    // Se não for 'Enviado' (ou já foi processado), apenas atualiza o status normal
    await docRef.update(updateData);
    const pedidoAtualizado = await docRef.get();
    res.status(200).json({ id: pedidoAtualizado.id, ...pedidoAtualizado.data() });

  } catch (error) {
    console.error(`ERRO em PUT /admin/orders/${req.params.id}:`, error.message);
    res.status(500).json({ message: "Erro ao atualizar status do pedido.", error: error.message });
  }
});


// --- 8. INICIALIZAÇÃO DO SERVIDOR (Local vs. Vercel) ---
if (process.env.VERCEL_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`[API] Backend rodando em http://localhost:${PORT}`);
  });
}

// Exporta o 'app' para a Vercel
module.exports = app;