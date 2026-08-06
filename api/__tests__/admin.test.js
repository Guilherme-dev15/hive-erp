import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import createApp from '../index';

// 1. Mock do Banco de Dados (Firestore)
// Reflete a cadeia de chamadas real: db.collection(...).where(...).limit(1).get()
const getMock = vi.fn();

// Função para criar uma cadeia de mocks encadeada para qualquer coleção.
const createMockQuery = () => {
  const query = {
    where: vi.fn(),
    limit: vi.fn(),
    get: getMock,
  };
  query.where.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  return query;
};

const mockDb = {
  collection: vi.fn(() => createMockQuery()),
};

// 2. Inicialização do App
const app = createApp(mockDb);

describe('Admin Routes - GET /admin/config', () => {

  it('should return 200 and the store configuration when data exists', async () => {
    // Configura o mock ANTES de cada teste (sem beforeEach/clearAllMocks).
    const mockConfigData = {
      storeName: 'HivePratas',
      contactEmail: 'contato@hivepratas.com',
    };
    getMock.mockResolvedValue({
      empty: false,
      docs: [{
        id: 'settings',
        data: () => mockConfigData,
      }],
    });

    const response = await request(app)
      .get('/admin/config')
      .set('Authorization', 'Bearer mock-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 'settings',
      ...mockConfigData,
    });
  });

  it('should return 200 and an empty object if config does not exist', async () => {
    // Sobrescreve a configuração do mock deste teste.
    getMock.mockResolvedValue({
      empty: true,
      docs: [],
    });

    const response = await request(app)
      .get('/admin/config')
      .set('Authorization', 'Bearer mock-token');

    // O código retorna 200 {} quando vazio, não 404.
    expect(response.status).toBe(200);
    expect(response.body).toEqual({});
  });
});
