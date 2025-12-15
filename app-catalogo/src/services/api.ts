import axios from 'axios';
import { OrderPayload } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const apiClient = axios.create({ baseURL: API_URL });

export const saveOrder = async (payload: OrderPayload) => {
  const response = await apiClient.post('/orders', payload);
  return response.data;
};

export const checkCoupon = async (code: string) => {
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