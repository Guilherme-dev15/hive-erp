const { admin } = require('../config/firebase');

const authenticateUser = async (req, res, next) => {
  // Bypass de autenticação para ambiente de testes (Injeção de dependência via Header ou variável)
  if (process.env.NODE_ENV === 'test' && req.headers['x-test-uid']) {
    req.user = { uid: req.headers['x-test-uid'], email: 'test@example.com' };
    return next();
  }

  if (!admin.apps.length) {
    return res.status(503).json({ error: "Servidor indisponível" });
  }

  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token de autenticação necessário.' });
  }

  const idToken = header.split(' ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = { uid: decodedToken.uid, email: decodedToken.email };
    next();
  } catch (error) {
    console.error("Erro de autenticação, token inválido:", error.code || error.message);
    return res.status(403).json({ message: 'Acesso negado. Token inválido.' });
  }
};

module.exports = authenticateUser;
