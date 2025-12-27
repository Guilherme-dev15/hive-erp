import axios from 'axios';
import { OrderPayload } from '../types';

// 1. Definição da URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// 2. Criação da instância (O NOME É apiClient)
export const apiClient = axios.create({ baseURL: API_URL });

export const saveOrder = async (payload: OrderPayload) => {
  // ✅ Correto: usando apiClient
  const response = await apiClient.post('/orders', payload);
  return response.data;
};

export const checkCoupon = async (code: string) => {
  // 🔴 O erro estava aqui. Você devia estar usando "api.post"
  // ✅ CORREÇÃO: Mudamos para "apiClient.post"
  const response = await apiClient.post('/validate-coupon', { code });
  return response.data; 
};

export const fetchCatalogData = async () => {
  const [prodRes, confRes, catRes] = await Promise.all([
    apiClient.get('/products-public').catch(() => ({ data: [] })),
    apiClient.get('/config-public').catch(() => ({ data: null })),
    apiClient.get('/categories-public').catch(() => ({ data: [] }))
  ]);
  
  return {
    produtos: prodRes.data,
    config: confRes.data,
    categorias: catRes.data
  };
};