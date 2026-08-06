// Mock do Firebase Admin escrito em CommonJS (não ESM) para interceptar `require()`.
// Este arquivo será usado como substituto do módulo real 'firebase-admin' durante os testes.

const mockFirestore = {
  collection: function() { return mockFirestore; },
  where: function() { return mockFirestore; },
  limit: function() { return mockFirestore; },
  get: () => Promise.resolve({ empty: true, docs: [] }),
  set: () => {},
  update: () => {},
  doc: function() { return { id: 'mock-doc-id', get: mockFirestore.get }; },
  batch: function() { return { set: () => {}, update: () => {}, commit: () => Promise.resolve() }; }
};

const admin = {
  apps: [{}], // Simula um app já inicializado.
  initializeApp: () => {}, // Função vazia, não tenta carregar nada.
  credential: {
    cert: () => ({}),
  },
  firestore: () => mockFirestore,
  auth: () => ({
    // Torna o mock dinâmico: o UID é derivado do token enviado.
    // Convencao: o token "tenant-a-token" -> uid "tenant-a-uid".
    // Qualquer outro token -> uid generico "test-uid".
    verifyIdToken: (idToken) => {
      if (idToken === 'tenant-a-token') return Promise.resolve({ uid: 'tenant-a-uid', email: 'tenant-a@test.com' });
      if (idToken === 'tenant-b-token') return Promise.resolve({ uid: 'tenant-b-uid', email: 'tenant-b@test.com' });
      return Promise.resolve({ uid: 'test-uid', email: 'test@test.com' });
    },
  }),
};

admin.firestore.FieldValue = {
  serverTimestamp: () => new Date(),
  increment: (n) => `increment(${n})`,
};
admin.firestore.Timestamp = {
  fromDate: (date) => date,
};

module.exports = admin;
module.exports.default = admin; // Compatibilidade com imports tipo ESM
