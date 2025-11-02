const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// Tenta carregar a chave de serviço
let serviceAccount;
try {
  serviceAccount = require('./serviceAccountKey.json');
} catch (error) {
  console.error("ERRO CRÍTICO: Não foi possível encontrar ou ler o ficheiro 'serviceAccountKey.json'.");
  console.error("Verifique se o ficheiro está na pasta 'api/' e se o JSON é válido.");
  process.exit(1);
}

// Inicializa o Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error("ERRO CRÍTICO: Falha ao inicializar o Firebase Admin.");
  console.error("Verifique se a 'serviceAccountKey.json' é válida e tem as permissões corretas.");
  process.exit(1);
}

const db = admin.firestore();
const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3001;

// --- ROTAS DA API ---

// ============================================================================
// MÓDULO: CATÁLOGO PÚBLICO (app-catalogo)
// ============================================================================

// Rota PÚBLICA (para o Catálogo)
app.get('/produtos-catalogo', async (req, res) => {
  console.log("ROTA: GET /produtos-catalogo foi acionada.");
  try {
    const snapshot = await db.collection('products').get();
    
    if (snapshot.empty) {
      console.log("AVISO: A coleção 'products' está vazia.");
      return res.status(200).json([]);
    }
    
    const produtos = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Nome Indisponível',
        imageUrl: data.imageUrl || null,
        code: data.code || 'N/A',
        category: data.category || 'Sem Categoria',
        description: data.description || ''
      };
    });
    
    console.log(`SUCESSO: /produtos-catalogo - ${produtos.length} produtos encontrados.`);
    res.status(200).json(produtos);

  } catch (error) {
    console.error("ERRO DETALHADO em /produtos-catalogo:", error.message);
    res.status(500).json({ 
      message: "Erro interno ao buscar produtos do catálogo.",
      error: error.message 
    });
  }
});

// Rota PÚBLICA para o Catálogo buscar as Configurações
app.get('/config-publica', async (req, res) => {
  console.log("ROTA: GET /config-publica foi acionada.");
  try {
    const doc = await db.collection('config').doc('settings').get();
    
    if (!doc.exists) {
      console.error("ERRO: Documento 'config/settings' não encontrado.");
      return res.status(404).json({ message: "Configuração não encontrada." });
    }
    
    const settings = doc.data();
    
    // Enviamos SÓ o que o cliente precisa
    const configPublica = {
      whatsappNumber: settings.whatsappNumber || null
    };

    console.log("SUCESSO: /config-publica - Configurações públicas enviadas.");
    res.status(200).json(configPublica);

  } catch (error) {
    console.error("ERRO DETALHADO em /config-publica:", error.message);
    res.status(500).json({
      message: "Erro interno ao buscar configuração pública.",
      error: error.message
    });
  }
});

// ============================================================================
// MÓDULO: ADMIN (app-admin)
// ============================================================================

// --- ROTAS DE PRODUTOS (ADMIN) ---

// GET (Ler)
app.get('/admin/produtos', async (req, res) => {
  console.log("ROTA: GET /admin/produtos foi acionada.");
  try { 
    const snapshot = await db.collection('products').get();
    
    if (snapshot.empty) {
      console.log("AVISO: A coleção 'products' está vazia.");
      return res.status(200).json([]);
    }
    
    const produtos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`SUCESSO: /admin/produtos - ${produtos.length} produtos encontrados.`);
    res.status(200).json(produtos);

  } catch (error) { 
    console.error("ERRO DETALHADO em /admin/produtos:", error.message);
    res.status(500).json({ 
      message: "Erro interno ao buscar produtos de admin.",
      error: error.message 
    });
  }
});

// POST (Criar)
app.post('/admin/produtos', async (req, res) => {
  console.log("ROTA: POST /admin/produtos foi acionada.");
  try {
    const novoProduto = req.body;
    if (!novoProduto || !novoProduto.name || !novoProduto.costPrice) {
      console.warn("Tentativa de POST /admin/produtos com dados em falta.");
      return res.status(400).json({ message: "Dados do produto em falta. 'name' e 'costPrice' são obrigatórios." });
    }
    
    const docRef = await db.collection('products').add(novoProduto);
    
    console.log(`SUCESSO: POST /admin/produtos - Produto criado com ID: ${docRef.id}`);
    res.status(201).json({ id: docRef.id, ...novoProduto });

  } catch (error) {
    console.error("ERRO DETALHADO em POST /admin/produtos:", error.message);
    res.status(500).json({ 
      message: "Erro interno ao criar produto.",
      error: error.message 
    });
  }
});

// PUT (Atualizar)
app.put('/admin/produtos/:id', async (req, res) => {
  const { id } = req.params;
  const dadosAtualizados = req.body;
  
  console.log(`ROTA: PUT /admin/produtos/${id} foi acionada.`);
  
  try {
    if (!id) {
      return res.status(400).json({ message: "ID do produto em falta." });
    }
    if (!dadosAtualizados || !dadosAtualizados.name || !dadosAtualizados.costPrice) {
      console.warn("Tentativa de PUT /admin/produtos com dados em falta.");
      return res.status(400).json({ message: "Dados do produto em falta. 'name' e 'costPrice' são obrigatórios." });
    }

    await db.collection('products').doc(id).update(dadosAtualizados);
    
    console.log(`SUCESSO: Produto com ID: ${id} foi atualizado.`);
    res.status(200).json({ id: id, ...dadosAtualizados });

  } catch (error) {
    console.error(`ERRO DETALHADO ao atualizar produto ${id}:`, error.message);
    res.status(500).json({ 
      message: "Erro interno ao atualizar produto.",
      error: error.message 
    });
  }
});

// DELETE (Apagar)
app.delete('/admin/produtos/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`ROTA: DELETE /admin/produtos/${id} foi acionada.`);
  
  try {
    if (!id) {
      return res.status(400).json({ message: "ID do produto em falta." });
    }

    await db.collection('products').doc(id).delete();
    
    console.log(`SUCESSO: Produto com ID: ${id} foi apagado.`);
    res.status(204).send(); 

  } catch (error) {
    console.error(`ERRO DETALHADO ao apagar produto ${id}:`, error.message);
    res.status(500).json({ 
      message: "Erro interno ao apagar produto.",
      error: error.message 
    });
  }
});


// --- ROTAS DE FORNECEDORES (ADMIN) ---

// GET (Ler)
app.get('/admin/fornecedores', async (req, res) => {
  console.log("ROTA: GET /admin/fornecedores foi acionada.");
  try { 
    const snapshot = await db.collection('suppliers').get();
    
    if (snapshot.empty) {
      console.log("AVISO: A coleção 'suppliers' está vazia.");
      return res.status(200).json([]);
    }
    
    const fornecedores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`SUCESSO: /admin/fornecedores - ${fornecedores.length} encontrados.`);
    res.status(200).json(fornecedores);

  } catch (error) { 
    console.error("ERRO DETALHADO em /admin/fornecedores:", error.message);
    res.status(500).json({ 
      message: "Erro interno ao buscar fornecedores.",
      error: error.message 
    });
  }
});

// POST (Criar)
app.post('/admin/fornecedores', async (req, res) => {
  console.log("ROTA: POST /admin/fornecedores foi acionada.");
  try {
    const novoFornecedor = req.body;
    if (!novoFornecedor || !novoFornecedor.name) {
      console.warn("Tentativa de POST /admin/fornecedores com 'name' em falta.");
      return res.status(400).json({ message: "O 'name' do fornecedor é obrigatório." });
    }

    const docRef = await db.collection('suppliers').add(novoFornecedor);
    
    console.log(`SUCESSO: POST /admin/fornecedores - Fornecedor criado com ID: ${docRef.id}`);
    res.status(201).json({ id: docRef.id, ...novoFornecedor });

  } catch (error) {
    console.error("ERRO DETALHADO em POST /admin/fornecedores:", error.message);
    res.status(500).json({ 
      message: "Erro interno ao criar fornecedor.",
      error: error.message 
    });
  }
});

// PUT (Atualizar)
app.put('/admin/fornecedores/:id', async (req, res) => {
  const { id } = req.params;
  const dadosAtualizados = req.body;
  
  console.log(`ROTA: PUT /admin/fornecedores/${id} foi acionada.`);
  
  try {
    if (!id) {
      return res.status(400).json({ message: "ID do fornecedor em falta." });
    }
    if (!dadosAtualizados || !dadosAtualizados.name) {
      console.warn("Tentativa de PUT /admin/fornecedores com 'name' em falta.");
      return res.status(400).json({ message: "O 'name' do fornecedor é obrigatório." });
    }

    await db.collection('suppliers').doc(id).update(dadosAtualizados);
    
    console.log(`SUCESSO: Fornecedor com ID: ${id} foi atualizado.`);
    res.status(200).json({ id: id, ...dadosAtualizados });

  } catch (error) {
    console.error(`ERRO DETALHADO ao atualizar fornecedor ${id}:`, error.message);
    res.status(500).json({ 
      message: "Erro interno ao atualizar fornecedor.",
      error: error.message 
    });
  }
});

// DELETE (Apagar)
app.delete('/admin/fornecedores/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`ROTA: DELETE /admin/fornecedores/${id} foi acionada.`);
  
  try {
    if (!id) {
      return res.status(400).json({ message: "ID do fornecedor em falta." });
    }

    await db.collection('suppliers').doc(id).delete();
    
    console.log(`SUCESSO: Fornecedor com ID: ${id} foi apagado.`);
    res.status(204).send(); 

  } catch (error) {
    console.error(`ERRO DETALHADO ao apagar fornecedor ${id}:`, error.message);
    res.status(500).json({ 
      message: "Erro interno ao apagar fornecedor.",
      error: error.message 
    });
  }
});


// --- ROTAS DE FINANCEIRO (ADMIN) ---

// GET (Ler)
app.get('/admin/transacoes', async (req, res) => {
  console.log("ROTA: GET /admin/transacoes foi acionada.");
  try { 
    const snapshot = await db.collection('transactions')
                             .orderBy('date', 'desc')
                             .get();
    
    if (snapshot.empty) {
      console.log("AVISO: A coleção 'transactions' está vazia.");
      return res.status(200).json([]);
    }
    
    const transacoes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`SUCESSO: /admin/transacoes - ${transacoes.length} encontradas.`);
    res.status(200).json(transacoes);

  } catch (error) { 
    console.error("ERRO DETALHADO em /admin/transacoes:", error.message);
    res.status(500).json({ 
      message: "Erro interno ao buscar transações.",
      error: error.message 
    });
  }
});

// POST (Criar)
app.post('/admin/transacoes', async (req, res) => {
  console.log("ROTA: POST /admin/transacoes foi acionada.");
  try {
    const novaTransacao = req.body;
    
    if (!novaTransacao || !novaTransacao.type || !novaTransacao.amount || !novaTransacao.description || !novaTransacao.date) {
      console.warn("Tentativa de POST /admin/transacoes com dados em falta.");
      return res.status(400).json({ message: "Dados da transação em falta." });
    }

    novaTransacao.amount = parseFloat(novaTransacao.amount);
    novaTransacao.date = admin.firestore.Timestamp.fromDate(new Date(novaTransacao.date));

    const docRef = await db.collection('transactions').add(novaTransacao);
    
    console.log(`SUCESSO: POST /admin/transacoes - Transação criada com ID: ${docRef.id}`);
    res.status(201).json({ id: docRef.id, ...novaTransacao });

  } catch (error) {
    console.error("ERRO DETALHADO em POST /admin/transacoes:", error.message);
    res.status(500).json({ 
      message: "Erro interno ao criar transação.",
      error: error.message 
    });
  }
});

// PUT (Atualizar)
app.put('/admin/transacoes/:id', async (req, res) => {
  const { id } = req.params;
  const dadosAtualizados = req.body;
  
  console.log(`ROTA: PUT /admin/transacoes/${id} foi acionada.`);
  
  try {
    if (!id) {
      return res.status(400).json({ message: "ID da transação em falta." });
    }
    if (!dadosAtualizados.type || !dadosAtualizados.amount || !dadosAtualizados.description || !dadosAtualizados.date) {
      return res.status(400).json({ message: "Dados da transação em falta." });
    }

    dadosAtualizados.amount = parseFloat(dadosAtualizados.amount);
    dadosAtualizados.date = admin.firestore.Timestamp.fromDate(new Date(dadosAtualizados.date));

    await db.collection('transactions').doc(id).update(dadosAtualizados);
    
    console.log(`SUCESSO: Transação com ID: ${id} foi atualizada.`);
    res.status(200).json({ id: id, ...dadosAtualizados });

  } catch (error) {
    console.error(`ERRO DETALHADO ao atualizar transação ${id}:`, error.message);
    res.status(500).json({ 
      message: "Erro interno ao atualizar transação.",
      error: error.message 
    });
  }
});

// DELETE (Apagar)
app.delete('/admin/transacoes/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`ROTA: DELETE /admin/transacoes/${id} foi acionada.`);
  
  try {
    if (!id) {
      return res.status(400).json({ message: "ID da transação em falta." });
    }

    await db.collection('transactions').doc(id).delete();
    
    console.log(`SUCESSO: Transação com ID: ${id} foi apagada.`);
    res.status(204).send();

  } catch (error) {
    console.error(`ERRO DETALHADO ao apagar transação ${id}:`, error.message);
    res.status(500).json({ 
      message: "Erro interno ao apagar transação.",
      error: error.message 
    });
  }
});


// --- ROTA DO DASHBOARD (ADMIN) ---

app.get('/admin/dashboard-stats', async (req, res) => {
  console.log("ROTA: GET /admin/dashboard-stats foi acionada.");
  try {
    const snapshot = await db.collection('transactions').get();

    if (snapshot.empty) {
      console.log("AVISO: A coleção 'transactions' está vazia.");
      return res.status(200).json({
        totalVendas: 0,
        totalDespesas: 0,
        lucroLiquido: 0,
        saldoTotal: 0
      });
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
    }, {
      totalVendas: 0,
      totalDespesas: 0,
      lucroLiquido: 0,
      saldoTotal: 0
    });

    stats.lucroLiquido = stats.totalVendas + stats.totalDespesas;

    console.log("SUCESSO: /admin/dashboard-stats - Estatísticas calculadas.");
    res.status(200).json(stats);

  } catch (error) {
    console.error("ERRO DETALHADO em /admin/dashboard-stats:", error.message);
    res.status(500).json({
      message: "Erro interno ao calcular estatísticas.",
      error: error.message
    });
  }
});


// --- ROTAS DE CONFIGURAÇÃO (ADMIN) ---

// Definimos o caminho aqui, DEPOIS de 'db' ser criado.
const CONFIG_PATH = db.collection('config').doc('settings');

app.get('/admin/config', async (req, res) => {
  console.log("ROTA: GET /admin/config foi acionada.");
  try {
    const doc = await CONFIG_PATH.get();
    if (!doc.exists) {
      console.log("AVISO: Documento de configurações não encontrado.");
      return res.status(200).json({}); 
    }
    
    console.log("SUCESSO: /admin/config - Configurações encontradas.");
    res.status(200).json(doc.data());

  } catch (error) {
    console.error("ERRO DETALHADO em /admin/config:", error.message);
    res.status(500).json({
      message: "Erro interno ao buscar configurações.",
      error: error.message
    });
  }
});

app.post('/admin/config', async (req, res) => {
  console.log("ROTA: POST /admin/config foi acionada.");
  try {
    const novasConfiguracoes = req.body;
    await CONFIG_PATH.set(novasConfiguracoes, { merge: true });
    
    console.log("SUCESSO: POST /admin/config - Configurações salvas.");
    res.status(200).json(novasConfiguracoes);

  } catch (error) {
    console.error("ERRO DETALHADO em POST /admin/config:", error.message);
    res.status(500).json({
      message: "Erro interno ao salvar configurações.",
      error: error.message
    });
  }
});


// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => {
  console.log(`[API] Backend rodando em http://localhost:${PORT}`);
});