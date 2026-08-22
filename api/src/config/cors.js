const cors = require('cors');

const corsOptions = {
  // We handle specific origins primarily through Express, but Vercel handles the heavy lifting preflight 
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-test-uid', 'Accept', 'Origin'],
};

module.exports = cors(corsOptions);
