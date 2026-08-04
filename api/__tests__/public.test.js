import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import createApp from '../index';

const getMock = vi.fn();
const mockDb = {
  collection: vi.fn(() => ({
    // Simula a cadeia completa de chamadas
    where: vi.fn(() => ({
        where: vi.fn(() => ({ // Adiciona o segundo 'where'
            get: getMock,
        })),
        limit: vi.fn(() => ({
            get: getMock,
        })),
    })),
  })),
};

const app = createApp(mockDb);

describe('Public Routes - /validate-coupon', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

  it('should return valid:false for an invalid coupon', async () => {
    getMock.mockResolvedValue({ empty: true });

    const response = await request(app)
      .post('/validate-coupon')
      .send({ code: 'INVALIDO', storeId: 'test-store' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      valid: false,
      message: 'Cupom inválido',
    });
  });

  it('should return valid:true for a valid coupon', async () => {
    getMock.mockResolvedValue({
        empty: false,
        docs: [{
            data: () => ({
              code: 'VALIDO',
              status: 'ativo',
              type: 'percentage',
              discountValue: 10,
            }),
        }],
    });

    const response = await request(app)
      .post('/validate-coupon')
      .send({ code: 'VALIDO', storeId: 'test-store' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      valid: true,
      discountValue: 10,
      type: 'percentage',
      code: 'VALIDO',
    });
  });

  it('should return 400 if code or storeId is missing', async () => {
    const response = await request(app)
      .post('/validate-coupon')
      .send({ storeId: 'test-store' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      valid: false,
      message: 'Dados incompletos',
    });
  });
});
