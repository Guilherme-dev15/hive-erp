const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// --- 1. INICIALIZAÇÃO DA CHAVE ---
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

// --- 2. INICIALIZAÇÃO DO FIREBASE ---
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error("ERRO CRÍTICO: Falha ao inicializar o Firebase Admin.");
  console.error(error);
  process.exit(1);
}

// --- 3. CONFIGURAÇÃO DO APP E CONSTANTES ---
const db = admin.firestore();
const app = express();
const PORT = 3001;

// Constantes de Caminhos (Definidas DEPOIS do 'db')
const CONFIG_PATH = db.collection('config').doc('settings');
const PRODUCTS_COLLECTION = 'products';
const SUPPLIERS_COLLECTION = 'suppliers';
const TRANSACTIONS_COLLECTION = 'transactions';

// --- 4. CONFIGURAÇÃO DE CORS (Whitelist) ---
// (Esta é a configuração robusta que fizemos para a Vercel)
const allowedOrigins = [
  'https://hiveerp-catalogo.vercel.app',
  'https://hive-erp.vercel.app',
  'http://localhost:5173', // app-admin local
  'http://localhost:5174'  // app-catalogo local
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error(`Origem REJEITADA pelo CORS: ${origin}`);
      callback(new Error('Não permitido pelo CORS'));
    }
  }
};

app.use(cors(corsOptions));
app.use(express.json());


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
       // imageUrl: data.imageUrl || null,
        code: data.code || 'N/A',
        category: data.category || 'Sem Categoria',
        description: data.description || ''
        ,
        salePrice: data.salePrice || 0, // <-- NOVO CAMPO
        status: data.status || 'ativo' // <-- NOVO CAMPO
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

// ============================================================================
// MÓDULO: ADMIN (app-admin)
// ============================================================================

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


// --- 5. INICIALIZAÇÃO DO SERVIDOR (Local vs. Vercel) ---

// Apenas escuta na porta se NÃO estivermos na Vercel
if (process.env.VERCEL_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`[API] Backend rodando em http://localhost:${PORT}`);
  });
}

// Exporta o 'app' para a Vercel
module.exports = app;