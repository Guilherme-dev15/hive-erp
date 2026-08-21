require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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

  // 1. Middlewares Globais de Segurança (Fase 4: SEC-04 e SEC-05)
  // Ativa a proteção de proxy para a Vercel
  app.set('trust proxy', 1);

  // Hardening de segurança nos Headers HTTP
  app.use(helmet());

  // Limite de requisições: máximo 300 requisições a cada 15 min por IP
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: "Muitas requisições. Tente novamente mais tarde." }
  });

  // Limite mais restritivo para as rotas administrativas
  const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 150,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: "Limite de requisições de admin atingido." }
  });

  // CORS e Parsing
  app.use(corsMiddleware);
  app.use(express.json({ limit: '50mb' }));

  // Aplicar Rate Limiter Global para rotas públicas
  app.use('/', apiLimiter);

  // 2. Rotas (agora recebem db)
  const adminRoutes = createAdminRoutes(db);
  const publicRoutes = createPublicRoutes(db);

  app.use('/', publicRoutes);

  // O router /admin usa autenticação + rate limit restrito + rotas
  app.use('/admin', authenticateUser, adminLimiter, adminRoutes);

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
