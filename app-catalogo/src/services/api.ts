import axios from 'axios';
import { OrderPayload } from '../types';

// 1. Definição da URL (Aponte para a Vercel como fallback para evitar erros em produção)
const API_URL = import.meta.env.VITE_API_URL || 'https://hiveerp-api.vercel.app';

// 2. Criação da instância
export const apiClient = axios.create({ baseURL: API_URL });

/**
 * Salva o pedido no banco de dados.
 */
export const saveOrder = (data: OrderPayload) => 
  apiClient.post('/orders', data).then(res => res.data); // <--- Retorna .data direto!

/**
 * Valida o cupom de desconto.
 */
export const checkCoupon = async (code: string, storeId: string) => {
  const response = await apiClient.post('/validate-coupon', { code, storeId });
  return response.data; 
};

/**
 * Busca todos os dados da loja (Produtos, Configs, Categorias)
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
  const response = await apiClient.post('/create-payment-intent', { 
    amount, 
    storeId 
  });
  return response.data;
};

/**
 * Busca o ID da loja baseado no nome amigável (slug)
 */
export const fetchStoreBySlug = async (slug: string) => {
  const response = await apiClient.get('/config-by-slug', { params: { slug } });
  return response.data;
};