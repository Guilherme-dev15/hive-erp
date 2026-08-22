const cors = require('cors');

// Proteção CORS Estrita para produção (Fase 4: SEC-05)
const allowedOrigins = [
  'https://hiveerp-catalogo.vercel.app',
  'https://hive-erp.vercel.app',
  'http://localhost:5173', // Catálogo Local
  'http://localhost:5174', // Admin Local
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permite acessos sem origin (ex: Postman/Curl no lado servidor ou SSR)
    if (!origin) return callback(null, true);

    // Permite domínios exatos da nossa whitelist
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Fallback dinâmico seguro para qualquer subdomínio do NOSSO Vercel Project
    // Isso resolve falhas de branch previews e aliases do Vercel sem abrir a porta para hackers
    if (origin.endsWith('-guilherme-dev15s-projects.vercel.app')) {
      return callback(null, true);
    }

    console.warn(`[CORS BLOQUEADO] Tentativa de acesso bloqueada para origin: ${origin}`);
    callback(new Error('Bloqueado pelo CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-test-uid', 'Accept', 'Origin'],
};

module.exports = cors(corsOptions);
