const cors = require('cors');

// Proteção CORS Estrita para produção (Fase 4: SEC-05)
// Removidas as regex amplas de *.vercel.app em prol de literais estritos
const allowedOrigins = [
  'https://hiveerp-catalogo.vercel.app',
  'https://hive-erp.vercel.app',
  'http://localhost:5173', // Catálogo Local
  'http://localhost:5174', // Admin Local
];

// Opcional: Se houver necessiade futura de preview branches (PRs):
// A estratégia de vercel preview URLs em RegExp (.*) é perigosa pois permite
// que qualquer pessoa registre um subdomínio como `meu-hive-erp-catalogo.vercel.app`.
// A solução segura é validar o suffix, não através de .* cega, mas via header de ambiente
// no próprio Vercel (onde temos acesso à VERCEL_URL real)

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Permite acessos sem origin (ex: Postman/Curl no lado servidor)

    const isAllowed = allowedOrigins.includes(origin);

    // Permite de forma dinâmica URLs de preview da Vercel DO PRÓPRIO TIME
    // se formarem correspondência estrita com os aliases da Vercel.
    // Exemplo seguro se usássemos o sdk da Vercel ou validação do Host,
    // Mas por ora bloqueamos regex para estarmos "default deny".

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS BLOQUEADO] Tentativa de acesso bloqueada para origin: ${origin}`);
      callback(new Error('Bloqueado pelo CORS'));
    }
  },
  credentials: true, // Permite envio de cookies/auth tokens se necessário
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-test-uid'],
};

module.exports = cors(corsOptions);
