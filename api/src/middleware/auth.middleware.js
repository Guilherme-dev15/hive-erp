const { admin } = require('../config/firebase');

const authenticateUser = async (req, res, next) => {
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
    return res.status(403).json({ message: 'Acesso negado. Token inválido.' });
  }
};

module.exports = authenticateUser;
