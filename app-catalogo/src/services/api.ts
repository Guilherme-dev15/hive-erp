import axios from 'axios';
import { OrderPayload, PublicCatalogResponse } from '../types';

const configuredApiUrl = import.meta.env.VITE_API_URL as string | undefined;
const isProductionBuild = import.meta.env.PROD;

if (isProductionBuild && !configuredApiUrl) {
  throw new Error('VITE_API_URL is required for the catalog production build');
}

const API_URL = configuredApiUrl || 'http://localhost:3005';

export const apiClient = axios.create({ baseURL: API_URL });

/**
 * Salva o pedido. Pedidos públicos permanecem fora do contrato v1.
 */
export const saveOrder = (data: OrderPayload) =>
  apiClient.post('/orders', data).then((res) => res.data);

/**
 * Valida o cupom. Cupons públicos permanecem fora do contrato v1.
 */
export const checkCoupon = async (code: string, storeId: string) => {
  const response = await apiClient.post('/validate-coupon', { code, storeId });
  return response.data;
};

export const fetchCatalogData = async (slug: string): Promise<PublicCatalogResponse['data']> => {
  const response = await apiClient.get<PublicCatalogResponse>('/api/v1/public/catalog', {
    params: { slug },
  });

  if (response.data.version !== 'v1' || !response.data.data) {
    throw new Error('Resposta inválida do catálogo');
  }

  return response.data.data;
};

/**
 * Cria um Payment Intent. Pagamentos públicos permanecem fora do contrato v1.
 */
export const createPaymentIntent = async (amount: number, storeId: string) => {
  const response = await apiClient.post('/create-payment-intent', {
    amount,
    storeId,
  });
  return response.data;
};
