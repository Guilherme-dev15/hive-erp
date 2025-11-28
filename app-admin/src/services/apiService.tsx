import axios from 'axios';
// 1. Importar a 'auth' do Firebase
import { auth } from '../firebaseConfig'; 

import type { 
  ProdutoAdmin, 
  Fornecedor, 
  Transacao, 
  DashboardStats,
  Category,
  Order,
  OrderStatus
} from '../types/index.ts';

import type { 
  ProdutoFormData, 
  FornecedorFormData, 
  ConfigFormData, 
  TransacaoFormData
} from '../types/schemas.ts';

// ============================================================================
// Configuração da API
// ============================================================================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_URL,
});

// --- 2. INTERCEPTOR DE SEGURANÇA (O "Crachá") ---
apiClient.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  
  if (user) {
    // Se o utilizador estiver logado, pega o Token dele
    const token = await user.getIdToken();
    // E cola no cabeçalho da requisição
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});
// --- FIM DO INTERCEPTOR ---

export interface AppConfig extends ConfigFormData {
  banners: never[];
  cardFee: any;
  packagingCost: any;
  secondaryColor: string;
  primaryColor: string;
  storeName: string;
  productCounter?: number;
  split?: { net: number, reinvest: number, ops: number };
}

// ============================================================================
// Módulo: Dashboard
// ============================================================================
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await apiClient.get('/admin/dashboard-stats');
  return response.data;
};

// ============================================================================
// Módulo: Produtos
// ============================================================================
export const getAdminProdutos = async (): Promise<ProdutoAdmin[]> => {
  const response = await apiClient.get('/admin/produtos');
  return response.data;
};

export const createAdminProduto = async (produto: ProdutoFormData): Promise<ProdutoAdmin> => {
  const response = await apiClient.post('/admin/produtos', produto);
  return response.data;
};

export const updateAdminProduto = async (id: string, produto: ProdutoFormData): Promise<ProdutoAdmin> => {
  const response = await apiClient.put(`/admin/produtos/${id}`, produto);
  return response.data;
};

export const deleteAdminProduto = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/produtos/${id}`);
};

// ============================================================================
// Módulo: Fornecedores
// ============================================================================
export const getFornecedores = async (): Promise<Fornecedor[]> => {
  const response = await apiClient.get('/admin/fornecedores');
  return response.data;
};

export const createFornecedor = async (fornecedor: FornecedorFormData): Promise<Fornecedor> => {
  const response = await apiClient.post('/admin/fornecedores', fornecedor);
  return response.data;
};

export const updateFornecedor = async (id: string, fornecedor: FornecedorFormData): Promise<Fornecedor> => {
  const response = await apiClient.put(`/admin/fornecedores/${id}`, fornecedor);
  return response.data;
};

export const deleteFornecedor = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/fornecedores/${id}`);
};

// ============================================================================
// Módulo: Transações
// ============================================================================
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

// ============================================================================
// Módulo: Configurações
// ============================================================================
export const getConfig = async (): Promise<AppConfig> => {
  const response = await apiClient.get('/admin/config');
  return response.data;
};

export const saveConfig = async (config: ConfigFormData): Promise<AppConfig> => {
  const response = await apiClient.post('/admin/config', config);
  return response.data;
};

// ============================================================================
// Módulo: Categorias
// ============================================================================
export const getCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get('/admin/categories');
  return response.data;
};

export const createCategory = async (data: { name: string }): Promise<Category> => {
  const response = await apiClient.post('/admin/categories', data);
  return response.data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/categories/${id}`);
};

// ============================================================================
// Módulo: Pedidos (Orders)
// ============================================================================
export const getAdminOrders = async (): Promise<Order[]> => {
  const response = await apiClient.get('/admin/orders');
  return response.data;
};

export const updateAdminOrderStatus = async (id: string, status: OrderStatus): Promise<Order> => {
  const response = await apiClient.put(`/admin/orders/${id}`, { status });
  return response.data;
};


// ============================================================================
// Módulo: Gráficos do Dashboard
// ============================================================================
export interface ChartData {
  salesByDay: { name: string; vendas: number }[];
  incomeVsExpense: { name: string; value: number }[];
}

export const getDashboardCharts = async (): Promise<ChartData> => {
  const response = await apiClient.get('/admin/dashboard-charts');
  return response.data;
};