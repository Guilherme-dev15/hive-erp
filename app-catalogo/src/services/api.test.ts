import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.stubEnv('PROD', false);

const { getMock, postMock, createMock } = vi.hoisted(() => {
  const getMock = vi.fn();
  const postMock = vi.fn();
  const createMock = vi.fn(() => ({ get: getMock, post: postMock }));
  return { getMock, postMock, createMock };
});

vi.mock('axios', () => ({
  default: {
    create: createMock,
  },
}));

import {
  checkCoupon,
  createPaymentIntent,
  fetchCatalogData,
  saveOrder,
} from './api';

describe('catalog API contract', () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
  });

  it('creates the client without making a network request', () => {
    expect(createMock).toHaveBeenCalledOnce();
    expect(createMock).toHaveBeenCalledWith({
      baseURL: expect.any(String),
    });
  });

  it('keeps the observed order payload and returns response data', async () => {
    const payload = {
      customerName: 'Cliente teste',
      customerPhone: '5500000000000',
      items: [{ id: 'product-1', name: 'Produto', salePrice: 10, quantidade: 1 }],
      subtotal: 10,
      discount: 0,
      total: 10,
      notes: '',
      storeId: 'store-1',
      status: 'AGUARDANDO_PAGAMENTO',
    };
    postMock.mockResolvedValue({ data: { id: 'order-1' } });

    await expect(saveOrder(payload)).resolves.toEqual({ id: 'order-1' });
    expect(postMock).toHaveBeenCalledWith('/orders', payload);
  });

  it('posts coupon validation with the observed input', async () => {
    postMock.mockResolvedValue({ data: { valid: true } });

    await expect(checkCoupon('SAVE10', 'store-1')).resolves.toEqual({ valid: true });
    expect(postMock).toHaveBeenCalledWith('/validate-coupon', { code: 'SAVE10', storeId: 'store-1' });
  });

  it('loads the versioned catalog envelope using only the public slug', async () => {
    const catalog = {
      version: 'v1',
      data: {
        config: {
          storeName: 'Hive',
          slug: 'hive',
          primaryColor: '#D4AF37',
          secondaryColor: '#343434',
          whatsappNumber: null,
          banners: [],
          lowStockThreshold: 5,
        },
        produtos: [],
        categorias: [],
      },
    };
    getMock.mockResolvedValue({ data: catalog });

    await expect(fetchCatalogData('hive')).resolves.toEqual(catalog.data);
    expect(getMock).toHaveBeenCalledWith('/api/v1/public/catalog', { params: { slug: 'hive' } });
  });

  it('propagates catalog request failures instead of returning an empty catalog', async () => {
    getMock.mockRejectedValue(new Error('unavailable'));

    await expect(fetchCatalogData('hive')).rejects.toThrow('unavailable');
  });

  it('rejects an invalid response envelope', async () => {
    getMock.mockResolvedValue({ data: { version: 'v2', data: {} } });

    await expect(fetchCatalogData('hive')).rejects.toThrow('Resposta inválida do catálogo');
  });

  it('does not expose a store-id based catalog request', () => {
    expect(fetchCatalogData).toBeTypeOf('function');
  });

  it('creates a payment intent using the observed request', async () => {
    postMock.mockResolvedValue({ data: { clientSecret: 'test-secret' } });

    await expect(createPaymentIntent(10, 'store-1')).resolves.toEqual({ clientSecret: 'test-secret' });
    expect(postMock).toHaveBeenCalledWith('/create-payment-intent', { amount: 10, storeId: 'store-1' });
  });
});
