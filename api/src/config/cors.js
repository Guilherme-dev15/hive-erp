const cors = require('cors');

const allowedOrigins = [
  'https://hiveerp-catalogo.vercel.app',
  'https://hive-erp.vercel.app',
  /https:\/\/hiveerp-catalogo-.*\.vercel\.app$/,
  /https:\/\/hive-erp-.*\.vercel\.app$/,
  'http://localhost:5173', // Catálogo Local
  'http://localhost:5174', // Admin Local
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.some(allowed =>
      typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
    );
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado pelo CORS'));
    }
  }
};

module.exports = cors(corsOptions);
