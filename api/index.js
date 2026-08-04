require('dotenv').config();
const express = require('express');
const corsMiddleware = require('./src/config/cors');
const authenticateUser = require('./src/middleware/auth.middleware');
// Modificado para aceitar db injetado
const createAdminRoutes = require('./src/routes/admin.routes');
const createPublicRoutes = require('./src/routes/public.routes');

function createApp(db) {
  if (!db) {
    // Se nenhum db for injetado, usa o db real do firebase
    db = require('./src/config/firebase').db;
  }

  const app = express();

  // 1. Middlewares Globais
  app.use(corsMiddleware);
  app.use(express.json({ limit: '50mb' }));

  // 2. Rotas (agora recebem db)
  const adminRoutes = createAdminRoutes(db);
  const publicRoutes = createPublicRoutes(db);
  app.use('/', publicRoutes);
  app.use('/admin', authenticateUser, adminRoutes);

  return app;
}

// 3. Inicialização do Servidor (para uso em produção)
if (require.main === module) {
  const app = createApp(); // Cria com o db real
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 API Hive ERP Rodando na porta ${PORT}`);
  });
}

module.exports = createApp;
