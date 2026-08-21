import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. Cria objetos mock base
const getMock = vi.fn();
const orderByMock = vi.fn().mockReturnThis();
const whereMock = vi.fn().mockImplementation(() => ({
  orderBy: vi.fn(() => ({
    get: getMock
  })),
  get: getMock
}));
const addMock = vi.fn();

// Precisamos mockar O ARQUIVO LOCAL de config de firebase
vi.mock('../src/config/firebase', () => {
  return {
    db: {
      collection: vi.fn(() => ({
        where: whereMock,
        get: getMock,
        add: addMock,
        doc: vi.fn(),
        batch: vi.fn(),
        runTransaction: vi.fn()
      }))
    },
    admin: {
      apps: ['mock-app'],
      firestore: {
        FieldValue: {
          serverTimestamp: vi.fn()
        }
      },
      auth: () => ({
        // Em vez de mockar o verifyIdToken que é difícil em CJS,
        // usamos o header x-test-uid adicionado no middleware
        verifyIdToken: vi.fn()
      })
    },
    COLLECTIONS: {
      PRODUCTS: 'products',
      SUPPLIERS: 'suppliers',
      CATEGORIES: 'categories',
      TRANSACTIONS: 'transactions',
      ORDERS: 'orders',
      COUPONS: 'coupons',
      CONFIG: 'config',
      INVENTORY_LOGS: 'inventory_logs'
    }
  };
});

// Importações ocorrem DEPOIS do vi.mock
import request from 'supertest';
import createApp from '../index';
import { db } from '../src/config/firebase';

const app = createApp(db);

describe('Multi-Tenancy Isolation Tests', () => {
  const userA_UID = 'user-tenant-A';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('User from Tenant A should NOT see products from Tenant B', async () => {
    // 1. Setup
    const productFromTenantB = {
      id: 'product-b',
      name: 'Produto do Inquilino B',
      userId: 'tenant-B-owner-id',
    };

    getMock.mockResolvedValue({
      empty: false,
      docs: [
        {
          id: productFromTenantB.id,
          data: () => productFromTenantB,
        },
      ],
    });

    // 3. Execução
    const response = await request(app)
      .get('/admin/products')
      // Adicionamos o header que o middleware modificado escuta em ambiente de testes
      .set('x-test-uid', userA_UID)
      .set('Authorization', `Bearer test-token`);

    if (response.status !== 200) {
      console.error("DEBUG ERROR 500:", response.body);
    }

    // 4. Verificação
    expect(response.status).toBe(200);
    expect(response.body).not.toContain(
      expect.objectContaining({ id: 'product-b' })
    );
    expect(whereMock).toHaveBeenCalledWith(
      'userId',
      '==',
      userA_UID
    );
  });

  it('User from Tenant A can only create products for their own tenant', async () => {
    const newProductData = {
      name: 'Produto do Inquilino A',
      price: 100,
    };
    addMock.mockResolvedValue({ id: 'new-product-id' });

    await request(app)
      .post('/admin/products')
      .set('x-test-uid', userA_UID)
      .set('Authorization', `Bearer test-token`)
      .send(newProductData);

    expect(addMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ...newProductData,
        userId: userA_UID,
      })
    );
  });
});