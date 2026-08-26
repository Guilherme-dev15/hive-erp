import { describe, it, expect, vi, beforeEach } from 'vitest';

const getMock = vi.fn();
const aggregateGetMock = vi.fn();

const aggregateMock = vi.fn(() => ({
  get: aggregateGetMock
}));

const whereMock = vi.fn().mockImplementation(() => ({
  where: whereMock, // permite chaining: where().where()
  orderBy: vi.fn(() => ({ get: getMock })),
  get: getMock,
  aggregate: aggregateMock
}));

const addMock = vi.fn();

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
        FieldValue: { serverTimestamp: vi.fn() },
        Timestamp: { fromDate: vi.fn((date) => date) },
        AggregateField: {
          count: vi.fn(() => 'mock-count-field'),
          sum: vi.fn((field) => `mock-sum-${field}`)
        }
      },
      auth: () => ({ verifyIdToken: vi.fn() })
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

import request from 'supertest';
import createApp from '../index';
import { db } from '../src/config/firebase';

const app = createApp(db);

describe('Dashboard Stats API Integration Tests', () => {
  const userA_UID = 'user-tenant-A';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return aggregated dashboard stats correctly', async () => {
    // O controller usa Promise.all([ totalAggQuery.get(), todayAggQuery.get() ])
    // Vamos mockar as respostas exatas para cada query na ordem.
    aggregateGetMock
      .mockResolvedValueOnce({
        data: () => ({ totalOrders: 50, totalRevenue: 5000 })
      })
      .mockResolvedValueOnce({
        data: () => ({ ordersToday: 5 })
      });

    const response = await request(app)
      .get('/admin/dashboard/stats')
      .set('x-test-uid', userA_UID)
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      stats: {
        totalVendas: 5000,
        lucroLiquido: 2000, // 5000 * 0.4
        totalDespesas: 3000, // 5000 * 0.6
        saldoTotal: 5000,
        activeProducts: 0
      },
      charts: {
        salesByDay: [],
        incomeVsExpense: []
      },
      revenue: 5000,
      ordersToday: 5,
      totalOrders: 50,
      averageTicket: 100 // 5000 / 50
    });

    // Verifica se a primeira chain de coleção e filtro pertenceu ao mesmo userA
    expect(whereMock).toHaveBeenCalledWith('userId', '==', userA_UID);
    expect(aggregateMock).toHaveBeenCalledTimes(2);
  });
});