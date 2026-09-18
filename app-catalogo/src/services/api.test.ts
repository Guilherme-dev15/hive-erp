import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  fetchStoreBySlug,
  saveOrder,
} from './api';

describe('catalog API contract', () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
  });

  it('creates the client without making a network request', () => {
    expect(createMock).toHaveBeenCalledOnce();
    const createOptions = createMock.mock.calls[0]?.[0] as { baseURL?: string };
    expect(createOptions).toEqual({
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

  it('loads catalog resources in parallel and preserves independent fallbacks', async () => {
    getMock.mockImplementation((path: string) => {
      if (path === '/products-public') return Promise.reject(new Error('unavailable'));
      if (path === '/config-public') return Promise.resolve({ data: { storeName: 'Hive' } });
      return Promise.resolve({ data: [{ id: 'category-1' }] });
    });

    await expect(fetchCatalogData('store-1')).resolves.toEqual({
      produtos: [],
      config: { storeName: 'Hive' },
      categorias: [{ id: 'category-1' }],
    });
    expect(getMock).toHaveBeenCalledWith('/products-public', { params: { storeId: 'store-1' } });
    expect(getMock).toHaveBeenCalledWith('/config-public', { params: { storeId: 'store-1' } });
    expect(getMock).toHaveBeenCalledWith('/categories-public', { params: { storeId: 'store-1' } });
  });

  it('resolves a store by slug using the observed request', async () => {
    getMock.mockResolvedValue({ data: { storeId: 'store-1', storeName: 'Hive' } });

    await expect(fetchStoreBySlug('hive')).resolves.toEqual({ storeId: 'store-1', storeName: 'Hive' });
    expect(getMock).toHaveBeenCalledWith('/config-by-slug', { params: { slug: 'hive' } });
  });

  it('creates a payment intent using the observed request', async () => {
    postMock.mockResolvedValue({ data: { clientSecret: 'test-secret' } });

    await expect(createPaymentIntent(10, 'store-1')).resolves.toEqual({ clientSecret: 'test-secret' });
    expect(postMock).toHaveBeenCalledWith('/create-payment-intent', { amount: 10, storeId: 'store-1' });
  });
});
