import axios from 'axios';
import { OrderPayload } from '../types';

// 1. Definição da URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// 2. Criação da instância
export const apiClient = axios.create({ baseURL: API_URL });

/**
 * Salva o pedido no banco de dados.
 */
export const saveOrder = async (payload: OrderPayload) => {
  const response = await apiClient.post('/orders', payload);
  return response.data;
};

/**
 * Valida o cupom de desconto.
 * @param code - O texto do cupom
 * @param storeId - O UID do lojista
 */
export const checkCoupon = async (code: string, storeId: string) => {
  const response = await apiClient.post('/validate-coupon', { code, storeId });
  return response.data; 
};

/**
 * Busca todos os dados da loja (Produtos, Configs, Categorias)
 * @param storeId - O UID do lojista capturado da URL
 */
export const fetchCatalogData = async (storeId: string) => {
  const [prodRes, confRes, catRes] = await Promise.all([
    apiClient.get('/products-public', { params: { storeId } }).catch(() => ({ data: [] })),
    apiClient.get('/config-public', { params: { storeId } }).catch(() => ({ data: null })),
    apiClient.get('/categories-public', { params: { storeId } }).catch(() => ({ data: [] }))
  ]);
  
  return {
    produtos: prodRes.data,
    config: confRes.data,
    categorias: catRes.data
  };
};

// 3. Função para criar o Payment Intent
export const createPaymentIntent = async (amount: number, storeId: string) => {
  try {
    const response = await apiClient.post('/create-payment-intent', { 
      amount, 
      storeId 
    });
    return response.data; // Retorna { clientSecret: "..." }
  } catch (error) {
    console.error("Erro ao criar pagamento:", error);
    throw error;
  }
};

/**
 * Busca o ID da loja baseado no nome amigável (slug)
 * Ex: busca 'hivepratas' e retorna o ID 'He8p0w...'
 * @param slug - O nome da loja na URL
 */
export const fetchStoreBySlug = async (slug: string) => {
  const response = await apiClient.get('/config-by-slug', { params: { slug } });
  return response.data;
};