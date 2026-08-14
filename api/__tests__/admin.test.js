import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import createApp from '../index';

// 1. Mock do Banco de Dados (Firestore)
const getMock = vi.fn();
const addMock = vi.fn();
const updateMock = vi.fn();
const deleteMock = vi.fn();

// Função para criar uma cadeia de mocks encadeada para qualquer coleção.
const createMockQuery = () => {
  const docMock = {
    update: updateMock,
    delete: deleteMock,
  };
  const query = {
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    get: getMock,
    add: addMock,
    doc: vi.fn(() => docMock), // .doc() retorna um mock com update/delete
  };
  query.where.mockReturnValue(query);
  query.orderBy.mockReturnValue(query);
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

describe('Admin Routes - GET /admin/products', () => {

  it('should return 200 and an array of products', async () => {
    // Configura o mock para retornar uma lista de produtos.
    const mockProducts = [
      { id: 'prod1', name: 'Anel de Ouro', price: 100 },
      { id: 'prod2', name: 'Corrente de Prata', price: 50 },
    ];
    getMock.mockResolvedValue({
      empty: false,
      docs: mockProducts.map(p => ({
        id: p.id,
        data: () => ({ name: p.name, price: p.price, userId: 'test-uid' }),
      })),
    });

    const response = await request(app)
      .get('/admin/products')
      .set('Authorization', 'Bearer mock-token');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toHaveProperty('id', 'prod1');
    expect(response.body[0]).toHaveProperty('name', 'Anel de Ouro');
  });
});

describe('Admin Routes - POST /admin/products', () => {

  it('should return 200 and the created product data', async () => {
    // Configura o mock do 'add' para retornar um ID.
    addMock.mockResolvedValue({
      id: 'new-prod-id',
    });

    const newProduct = {
      name: 'Pulseira de Prata',
      price: 75,
      quantity: 10,
    };

    const response = await request(app)
      .post('/admin/products')
      .set('Authorization', 'Bearer mock-token')
      .send(newProduct);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 'new-prod-id');
    expect(response.body).toHaveProperty('name', newProduct.name);
    expect(response.body).toHaveProperty('price', newProduct.price);
  });
});

describe('Admin Routes - PUT /admin/products/:id', () => {

  it('should return 200 on successful update', async () => {
    updateMock.mockResolvedValue(); // Simula um update bem-sucedido

    const updatedData = {
      price: 120,
    };

    const response = await request(app)
      .put('/admin/products/some-prod-id')
      .set('Authorization', 'Bearer mock-token')
      .send(updatedData);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 'some-prod-id' });
    expect(updateMock).toHaveBeenCalledWith(updatedData);
  });
});

describe('Admin Routes - DELETE /admin/products/:id', () => {

  it('should return 204 on successful delete', async () => {
    deleteMock.mockResolvedValue(); // Simula um delete bem-sucedido

    const response = await request(app)
      .delete('/admin/products/some-prod-id')
      .set('Authorization', 'Bearer mock-token');

    expect(response.status).toBe(204);
    expect(deleteMock).toHaveBeenCalled();
  });
});


