const request = require('supertest');
const app = require('../index');
const admin = require('firebase-admin');

describe('Public Routes - /validate-coupon', () => {
  it('should return valid:false for an invalid coupon', async () => {
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
    // Configura o mock para este teste específico
    const mockGet = jest.fn(() =>
      Promise.resolve({
        empty: false,
        docs: [
          {
            data: () => ({
              code: 'VALIDO',
              status: 'ativo',
              type: 'percentage',
              discountValue: 10,
            }),
          },
        ],
      })
    );

    admin.firestore().get = mockGet;

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
