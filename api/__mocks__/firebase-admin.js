const mockFirestore = {
  collection: jest.fn(),
  where: jest.fn(),
  limit: jest.fn(),
  get: jest.fn(() => Promise.resolve({ empty: true, docs: [] })),
  set: jest.fn(),
  update: jest.fn(),
};

const mockDoc = {
  get: mockFirestore.get,
  set: mockFirestore.set,
  update: mockFirestore.update,
  collection: mockFirestore.collection,
  // Adiciona um ID para referências
  id: 'mock-doc-id'
};

mockFirestore.collection.mockReturnValue(mockFirestore);
mockFirestore.where.mockReturnValue(mockFirestore);
mockFirestore.limit.mockReturnValue(mockFirestore);
// Agora, doc() sempre retorna um objeto com os métodos necessários
mockFirestore.doc = jest.fn(() => mockDoc);

const mockBatch = {
  set: jest.fn(),
  update: jest.fn(),
  commit: jest.fn(() => Promise.resolve()),
};
mockFirestore.batch = jest.fn(() => mockBatch);

const admin = {
  apps: [{}],
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
  firestore: () => mockFirestore,
  auth: () => ({
    verifyIdToken: jest.fn(() => Promise.resolve({ uid: 'test-uid', email: 'test@test.com' })),
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
