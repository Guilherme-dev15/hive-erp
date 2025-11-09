const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const app = express(); // <-- 1. 'app' definido logo no início
const PORT = 3001;

// --- 1. CONFIGURAÇÃO DE CORS (Whitelist) ---
// (Movido para o topo, para ser usado antes de tudo)
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

// --- 2. CONFIGURAÇÃO DE MIDDLEWARE ---
app.use(cors(corsOptions)); // <-- 'app' já existe
app.use(express.json({ limit: '10mb' })); // <-- 2. Apenas uma chamada, com o limite de 10mb

// --- 3. INICIALIZAÇÃO DA CHAVE FIREBASE ---
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

// --- 4. INICIALIZAÇÃO DO FIREBASE (CORRIGIDA PARA VERCEL) ---
// (Esta correção já estava correta no seu ficheiro)
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

// --- 5. CONSTANTES DO BANCO DE DADOS ---
const db = admin.firestore();
const CONFIG_PATH = db.collection('config').doc('settings');
const PRODUCTS_COLLECTION = 'products';
const SUPPLIERS_COLLECTION = 'suppliers';
const TRANSACTIONS_COLLECTION = 'transactions';
const CATEGORIES_COLLECTION = 'categories';


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
        status: data.status || 'ativo'
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

// ============================================================================
// MÓDULO: ADMIN (app-admin)
// ============================================================================

// --- ROTA: GEMINI NAMER (IA) ---
app.post('/admin/generate-name', async (req, res) => {
  console.log("ROTA: POST /admin/generate-name");
  try {
    const { imageDataBase64, imageMimeType } = req.body;
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ message: "API Key do Google não configurada no servidor." });
    }
    if (!imageDataBase64 || !imageMimeType) {
      return res.status(400).json({ message: "Dados da imagem em falta." });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const systemPrompt = `
      Você é um especialista em marketing e nomenclatura de joias, especificamente para uma marca de joias de prata de luxo.
      Sua tarefa é analisar a imagem de uma joia, descrevê-la brevemente e, em seguida, criar um nome único, elegante e memorável para ela.
      O nome deve evocar sentimentos de beleza, elegância, ou ter relação com o design da peça.
      Responda APENAS em formato JSON válido, com as chaves "descricao" e "nome_sugerido".
      Use Português do Brasil.
    `;

    const payload = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          role: "user",
          parts: [
            { text: "Analise esta imagem e forneça a descrição e o nome sugerido." },
            {
              inlineData: {
                mimeType: imageMimeType,
                data: imageDataBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
      }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Erro na API Gemini:', response.status, errorBody);
      throw new Error(`A API do Google retornou um erro: ${response.status}`);
    }

    const result = await response.json();
    const jsonText = result.candidates[0].content.parts[0].text;
    res.status(200).json(JSON.parse(jsonText));

  } catch (error) {
    console.error("ERRO em /admin/generate-name:", error.message);
    res.status(500).json({ message: "Erro interno ao processar IA.", error: error.message });
  }
});


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
// (O seu código de fornecedores estava correto, omitido por brevidade)
app.get('/admin/fornecedores', async (req, res) => { /* ... */ });
app.post('/admin/fornecedores', async (req, res) => { /* ... */ });
app.put('/admin/fornecedores/:id', async (req, res) => { /* ... */ });
app.delete('/admin/fornecedores/:id', async (req, res) => { /* ... */ });


// --- ROTAS DE FINANCEIRO (ADMIN) ---
// (O seu código de transações estava correto, omitido por brevidade)
app.get('/admin/transacoes', async (req, res) => { /* ... */ });
app.post('/admin/transacoes', async (req, res) => { /* ... */ });
app.put('/admin/transacoes/:id', async (req, res) => { /* ... */ });
app.delete('/admin/transacoes/:id', async (req, res) => { /* ... */ });


// --- ROTA DO DASHBOARD (ADMIN) ---
// (O seu código do dashboard estava correto, omitido por brevidade)
app.get('/admin/dashboard-stats', async (req, res) => { /* ... */ });


// --- ROTAS DE CONFIGURAÇÃO (ADMIN) ---
// (O seu código de config estava correto, omitido por brevidade)
app.get('/admin/config', async (req, res) => { /* ... */ });
app.post('/admin/config', async (req, res) => { /* ... */ });


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

// 3. ROTA DE DELETE (CORRIGIDA - Bloco duplicado removido)
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


// --- 6. INICIALIZAÇÃO DO SERVIDOR (Local vs. Vercel) ---

// Apenas escuta na porta se NÃO estivermos na Vercel
if (process.env.VERCEL_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`[API] Backend rodando em http://localhost:${PORT}`);
  });
}

// Exporta o 'app' para a Vercel
module.exports = app;