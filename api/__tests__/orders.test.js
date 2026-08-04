import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import createApp from '../index'; // Importa a função factory

// Mocks
const getMock = vi.fn();
const commitMock = vi.fn();
const updateBatchMock = vi.fn();
const setBatchMock = vi.fn();

const mockDb = {
  collection: vi.fn().mockReturnThis(),
  doc: vi.fn((id) => ({
    get: getMock,
    id: id || 'mock-order-id',
  })),
  batch: () => ({
    update: updateBatchMock,
    set: setBatchMock,
    commit: commitMock,
  }),
};

// Cria a aplicação com o banco de dados mockado
const app = createApp(mockDb);

describe('POST /orders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create an order and decrement product quantity', async () => {
    getMock.mockResolvedValue({
      exists: true,
      data: () => ({ userId: 'store-owner-123', quantity: 10 }),
    });
    commitMock.mockResolvedValue();

    const orderPayload = {
      items: [{ id: 'product-1', quantidade: 2 }],
      customer: { name: 'Test Customer' },
      total: 100,
      storeId: 'store-owner-123',
    };

    const response = await request(app).post('/orders').send(orderPayload);

    expect(response.status).toBe(201);
    expect(response.body.id).toBe('mock-order-id');
    expect(commitMock).toHaveBeenCalled();
  });

  it('should return 404 if product does not exist', async () => {
    getMock.mockResolvedValue({ exists: false });

    const orderPayload = {
      items: [{ id: 'non-existent-product', quantidade: 1 }],
      total: 50,
    };

    const response = await request(app).post('/orders').send(orderPayload);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Um dos produtos no carrinho não foi encontrado.');
  });

  it('should return 500 if batch commit fails', async () => {
    getMock.mockResolvedValue({
      exists: true,
      data: () => ({ userId: 'store-owner-123' }),
    });
    commitMock.mockRejectedValue(new Error('Firestore commit failed'));

    const orderPayload = {
      items: [{ id: 'product-1', quantidade: 1 }],
      total: 50,
    };

    const response = await request(app).post('/orders').send(orderPayload);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Firestore commit failed');
  });
});
