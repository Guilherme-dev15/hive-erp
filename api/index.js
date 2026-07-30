require('dotenv').config();
const express = require('express');
const corsMiddleware = require('./src/config/cors');
const authenticateUser = require('./src/middleware/auth.middleware');
const publicRoutes = require('./src/routes/public.routes');
const adminRoutes = require('./src/routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// 1. Middlewares Globais
app.use(corsMiddleware);
app.use(express.json({ limit: '50mb' }));

// 2. Rotas
app.use('/', publicRoutes);
app.use('/admin', authenticateUser, adminRoutes);

// 3. Inicialização do Servidor
// Inicia o servidor apenas se este arquivo for executado diretamente
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 API Hive ERP Rodando na porta ${PORT}`);
  });
}

module.exports = app;
