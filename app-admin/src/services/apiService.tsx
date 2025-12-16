import axios from 'axios';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, storage } from '../firebaseConfig'; 

// --- TYPES & SCHEMAS ---
import type { 
  ProdutoAdmin, 
  Fornecedor, 
  Transacao, 
  DashboardStats, 
  Category, 
  Order, 
  OrderStatus, 
  Coupon, 
  ABCProduct,
  ChartData
} from '../types';

import type { 
  ProdutoFormData, 
  FornecedorFormData, 
  ConfigFormData, 
  TransacaoFormData 
} from '../types/schemas';

// ============================================================================
// CONFIGURAÇÃO DA CONEXÃO
// ============================================================================

const API_URL = import.meta.env.VITE_API_URL;

export const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================================
// SERVIÇO DE UPLOAD
// ============================================================================
export const uploadImage = async (file: File, _p0?: string): Promise<string> => {
  if (!file) return '';
  try {
    const cleanName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
    const fileName = `products/${Date.now()}_${cleanName}`;
    const storageRef = ref(storage, fileName);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error: any) {
    console.error("Erro no Upload:", error);
    throw new Error("Falha ao subir imagem.");
  }
};

// ============================================================================
// ENDPOINTS DA API
// ============================================================================

// --- PRODUTOS ---
export const getAdminProdutos = async (): Promise<ProdutoAdmin[]> => (await apiClient.get('/admin/products')).data;
export const createAdminProduto = async (data: ProdutoFormData): Promise<ProdutoAdmin> => (await apiClient.post('/admin/products', data)).data;
export const updateAdminProduto = async (id: string, data: ProdutoFormData): Promise<ProdutoAdmin> => (await apiClient.put(`/admin/products/${id}`, data)).data;
export const deleteAdminProduto = async (id: string): Promise<void> => apiClient.delete(`/admin/products/${id}`);
export const importProductsBulk = async (products: any[]): Promise<any> => (await apiClient.post('/admin/products/bulk', products)).data;

// --- FORNECEDORES ---
export const getFornecedores = async (): Promise<Fornecedor[]> => (await apiClient.get('/admin/suppliers')).data;
export const createFornecedor = async (data: FornecedorFormData): Promise<Fornecedor> => (await apiClient.post('/admin/suppliers', data)).data;
export const updateFornecedor = async (id: string, data: FornecedorFormData): Promise<Fornecedor> => (await apiClient.put(`/admin/suppliers/${id}`, data)).data;
export const deleteFornecedor = async (id: string): Promise<void> => apiClient.delete(`/admin/suppliers/${id}`);

// --- CATEGORIAS ---
export const getCategories = async (): Promise<Category[]> => (await apiClient.get('/admin/categories')).data;
export const createCategory = async (data: { name: string }): Promise<Category> => (await apiClient.post('/admin/categories', data)).data;
export const deleteCategory = async (id: string): Promise<void> => apiClient.delete(`/admin/categories/${id}`);

// --- FINANCEIRO ---
export const getTransacoes = async (): Promise<Transacao[]> => (await apiClient.get('/admin/transactions')).data;
export const createTransacao = async (data: TransacaoFormData): Promise<Transacao> => (await apiClient.post('/admin/transactions', data)).data;
export const updateTransacao = async (id: string, data: TransacaoFormData): Promise<Transacao> => (await apiClient.put(`/admin/transactions/${id}`, data)).data;
export const deleteTransacao = async (id: string): Promise<void> => apiClient.delete(`/admin/transactions/${id}`);

// --- PEDIDOS (AQUI ESTAVA O ERRO DE DUPLICIDADE) ---
export const getAdminOrders = async (): Promise<Order[]> => (await apiClient.get('/admin/orders')).data;
export const updateAdminOrderStatus = async (id: string, status: OrderStatus): Promise<Order> => (await apiClient.put(`/admin/orders/${id}`, { status })).data;
export const deleteAdminOrder = async (id: string): Promise<void> => apiClient.delete(`/admin/orders/${id}`);

// --- CUPONS ---
export const getCoupons = async (): Promise<Coupon[]> => (await apiClient.get('/admin/coupons')).data;
export const createCoupon = async (data: { code: string; discountPercent: number }): Promise<Coupon> => (await apiClient.post('/admin/coupons', data)).data;
export const deleteCoupon = async (id: string): Promise<void> => apiClient.delete(`/admin/coupons/${id}`);

// --- DASHBOARD & CONFIG ---
export const getDashboardStats = async (): Promise<DashboardStats> => (await apiClient.get('/admin/dashboard-stats')).data;
export const getDashboardCharts = async (): Promise<ChartData> => (await apiClient.get('/admin/dashboard-charts')).data;
export const getABCReport = async (): Promise<ABCProduct[]> => (await apiClient.get('/admin/reports/abc')).data;
export const getConfig = async (): Promise<any> => (await apiClient.get('/admin/config')).data;
export const saveConfig = async (data: ConfigFormData): Promise<any> => (await apiClient.post('/admin/config', data)).data;