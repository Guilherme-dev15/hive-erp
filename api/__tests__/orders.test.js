const request = require('supertest');
const app = require('../index');
const admin = require('firebase-admin');

describe('POST /orders', () => {
  let firestoreMock;

  beforeEach(() => {
    firestoreMock = admin.firestore();
    jest.clearAllMocks();
  });

  it('should create an order and decrement product quantity', async () => {
    // Configura o mock para ESTE teste: simula um produto que existe
    firestoreMock.get.mockResolvedValue({
      exists: true,
      data: () => ({ userId: 'store-owner-123', quantity: 10 }),
    });

    const batch = firestoreMock.batch();

    const orderPayload = {
      items: [{ id: 'product-1', quantidade: 2 }],
      customer: { name: 'Test Customer' },
      total: 100,
      storeId: 'store-owner-123',
    };

    const response = await request(app).post('/orders').send(orderPayload);

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.userId).toBe('store-owner-123');
    expect(response.body.status).toBe('Aguardando Pagamento');

    expect(batch.update).toHaveBeenCalledWith(expect.anything(), {
      quantity: 'increment(-2)',
    });
    expect(batch.commit).toHaveBeenCalled();
  });

  it('should return 404 if product does not exist', async () => {
    // Configura o mock para ESTE teste: simula um produto que NÃO existe
    firestoreMock.get.mockResolvedValue({ exists: false });

    const orderPayload = {
      items: [{ id: 'non-existent-product', quantidade: 1 }],
      total: 50,
    };

    const response = await request(app).post('/orders').send(orderPayload);

    expect(response.status).toBe(404); // <-- Corrigido de 500 para 404
    expect(response.body.error).toBe(
      'Um dos produtos no carrinho não foi encontrado.'
    );
  });

  it('should return 500 if batch commit fails', async () => {
    // Configura o mock para ESTE teste: produto existe, mas o commit falha
    firestoreMock.get.mockResolvedValue({
      exists: true,
      data: () => ({ userId: 'store-owner-123' }),
    });
    firestoreMock
      .batch()
      .commit.mockRejectedValue(new Error('Firestore commit failed'));

    const orderPayload = {
      items: [{ id: 'product-1', quantidade: 1 }],
      total: 50,
    };

    const response = await request(app).post('/orders').send(orderPayload);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Firestore commit failed');
  });
});
