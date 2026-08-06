import { vi } from 'vitest';

const mockFirestore = {
  collection: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  get: vi.fn(() => Promise.resolve({ empty: true, docs: [] })),
  set: vi.fn(),
  update: vi.fn(),
};

const mockDoc = {
  get: mockFirestore.get,
  set: mockFirestore.set,
  update: mockFirestore.update,
  collection: mockFirestore.collection,
  id: 'mock-doc-id',
};

// Configurando os retornos para encadeamento
mockFirestore.collection.mockReturnValue(mockFirestore);
mockFirestore.where.mockReturnValue(mockFirestore);
mockFirestore.limit.mockReturnValue(mockFirestore);
mockFirestore.doc = vi.fn(() => mockDoc); // doc() sempre retorna o objeto mockDoc

const mockBatch = {
  set: vi.fn(),
  update: vi.fn(),
  commit: vi.fn(() => Promise.resolve()),
};
mockFirestore.batch = vi.fn(() => mockBatch);

const admin = {
  apps: [{}], // Simula a existência de um app inicializado para evitar erros
  initializeApp: vi.fn(), // A função de inicialização é um mock vazio
  credential: {
    cert: vi.fn(), // A função de credencial é um mock vazio
  },
  firestore: () => mockFirestore,
  auth: () => ({
    verifyIdToken: vi.fn(() =>
      Promise.resolve({ uid: 'test-uid', email: 'test@test.com' })
    ),
  }),
};

admin.firestore.FieldValue = {
  serverTimestamp: () => new Date(),
  increment: (n) => `increment(${n})`,
};
admin.firestore.Timestamp = {
  fromDate: (date) => date,
};

export default admin;
