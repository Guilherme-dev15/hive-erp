import axios from 'axios';

// 1. IMPORTAÇÃO DAS INSTÂNCIAS JÁ CONFIGURADAS
import { auth } from '../firebaseConfig'; 

// 2. Imports utilitários do Storage
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- TIPOS ---
import type { 
  ProdutoAdmin, 
  Fornecedor, 
  Transacao, 
  DashboardStats, 
  Category, 
  Order, 
  OrderStatus, 
  Coupon, 
  ABCProduct
} from '../types';

import type { 
  ProdutoFormData, 
  FornecedorFormData, 
  ConfigFormData, 
  TransacaoFormData
} from '../types/schemas';

// ============================================================================
// CONFIGURAÇÃO DO STORAGE (BUCKET FORÇADO)
// ============================================================================
// Isso resolve o erro "No default bucket found"
const BUCKET_URL = "gs://hive-1874c.firebasestorage.app"; 
const storage = getStorage(auth.app, BUCKET_URL);

// ============================================================================
// CONFIGURAÇÃO DA API
// ============================================================================
const API_URL = import.meta.env.VITE_API_URL || 'https://hiveerp-api.vercel.app';

export const apiClient = axios.create({
  baseURL: API_URL,
});

// --- INTERCEPTOR DE SEGURANÇA ---
apiClient.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// --- TIPAGEM DA CONFIGURAÇÃO ---
export interface AppConfig extends Omit<ConfigFormData, 'warrantyText' | 'lowStockThreshold' | 'banners'> {
  banners: string[]; 
  cardFee: number;
  packagingCost: number;
  secondaryColor: string;
  primaryColor: string;
  storeName: string;
  warrantyText?: string;
  lowStockThreshold?: number;
  productCounter?: number;
}

// ============================================================================
// FUNÇÃO DE UPLOAD (COM BUCKET FIXO)
// ============================================================================
export const uploadImage = async (file: File, folder: string = 'produtos'): Promise<string> => {
  if (!file) return '';
  
  try {
    const fileName = `${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase()}`;
    
    // Usa a instância 'storage' com o bucket correto
    const storageRef = ref(storage, `${folder}/${fileName}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error: any) {
    console.error("Erro no upload Firebase:", error);
    throw new Error(`Falha ao subir imagem: ${error.message}`);
  }
};

// ============================================================================
// ROTAS PADRONIZADAS EM INGLÊS (STANDARD)
// ============================================================================

// --- Dashboard ---
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await apiClient.get('/admin/dashboard-stats');
  return response.data;
};

// --- Produtos (/admin/products) ---
export const getAdminProdutos = async (): Promise<ProdutoAdmin[]> => {
  const response = await apiClient.get('/admin/products');
  return response.data;
};

export const createAdminProduto = async (produto: ProdutoFormData): Promise<ProdutoAdmin> => {
  const response = await apiClient.post('/admin/products', produto);
  return response.data;
};

export const updateAdminProduto = async (id: string, produto: ProdutoFormData): Promise<ProdutoAdmin> => {
  const response = await apiClient.put(`/admin/products/${id}`, produto);
  return response.data;
};

export const deleteAdminProduto = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/products/${id}`);
};

// --- Fornecedores (/admin/suppliers) ---
export const getFornecedores = async (): Promise<Fornecedor[]> => {
  const response = await apiClient.get('/admin/suppliers');
  return response.data;
};

export const createFornecedor = async (fornecedor: FornecedorFormData): Promise<Fornecedor> => {
  const response = await apiClient.post('/admin/suppliers', fornecedor);
  return response.data;
};

export const updateFornecedor = async (id: string, fornecedor: FornecedorFormData): Promise<Fornecedor> => {
  const response = await apiClient.put(`/admin/suppliers/${id}`, fornecedor);
  return response.data;
};

export const deleteFornecedor = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/suppliers/${id}`);
};

// --- Transações (/admin/transacoes) - Mantido misto se a API não mudou esta ---
// Geralmente a rota de transações não foi alterada para transactions em alguns deploys,
// mas para padronizar inglês seria /admin/transactions. 
// VOU MANTER O QUE FUNCIONAVA NA VERSÃO INGLESA ANTERIOR:
export const getTransacoes = async (): Promise<Transacao[]> => {
  const response = await apiClient.get('/admin/transacoes');
  return response.data;
};

export const createTransacao = async (transacao: Omit<Transacao, 'id'>): Promise<Transacao> => {
  const response = await apiClient.post('/admin/transacoes', transacao);
  return response.data;
};

export const updateTransacao = async (id: string, transacao: TransacaoFormData): Promise<Transacao> => {
  const response = await apiClient.put(`/admin/transacoes/${id}`, transacao);
  return response.data;
};

export const deleteTransacao = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/transacoes/${id}`);
};

// --- Configurações ---
export const getConfig = async (): Promise<AppConfig> => {
  const response = await apiClient.get('/config-publica');
  return response.data;
};

export const saveConfig = async (config: ConfigFormData): Promise<AppConfig> => {
  const response = await apiClient.post('/admin/config', config);
  return response.data;
};

// --- Categorias (/categories) ---
export const getCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get('/categories');
  return response.data;
};

export const createCategory = async (data: { name: string }): Promise<Category> => {
  const response = await apiClient.post('/admin/categories', data);
  return response.data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/categories/${id}`);
};

// --- Pedidos (/admin/orders) ---
export const getAdminOrders = async (): Promise<Order[]> => {
  const response = await apiClient.get('/admin/orders');
  return response.data;
};

export const updateAdminOrderStatus = async (id: string, status: OrderStatus): Promise<Order> => {
  const response = await apiClient.put(`/admin/orders/${id}`, { status });
  return response.data;
};

// --- Gráficos e Relatórios ---
export interface ChartData {
  salesByDay: { name: string; vendas: number }[];
  incomeVsExpense: { name: string; value: number }[];
}

export const getDashboardCharts = async (): Promise<ChartData> => {
  const response = await apiClient.get('/admin/dashboard-charts');
  return response.data;
};

export const getCoupons = async (): Promise<Coupon[]> => {
  const response = await apiClient.get('/admin/coupons');
  return response.data;
};

export const createCoupon = async (data: { code: string; discountPercent: number }): Promise<Coupon> => {
  const response = await apiClient.post('/admin/coupons', data);
  return response.data;
};

export const deleteCoupon = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/coupons/${id}`);
};

export const getABCReport = async (): Promise<ABCProduct[]> => {
  const response = await apiClient.get('/admin/reports/abc');
  return response.data;
};