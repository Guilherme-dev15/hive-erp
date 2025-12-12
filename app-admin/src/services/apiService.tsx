import axios from 'axios';
// 1. Importar a 'auth' do Firebase
import { auth } from '../firebaseConfig'; 

// --- NOVO: Imports do Firebase Storage (NECESSÁRIO PARA UPLOAD) ---
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
// Configuração do Firebase Storage (Para Upload de Imagens)
// ============================================================================
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, // Essencial!
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Inicializa o app secundário apenas para o Storage
const storageApp = initializeApp(firebaseConfig, "StorageApp");
const storage = getStorage(storageApp);

// ============================================================================
// Configuração da API
// ============================================================================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_URL,
});

// --- 2. INTERCEPTOR DE SEGURANÇA (O "Crachá") ---
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

// --- TIPAGEM DA CONFIGURAÇÃO (Corrigida com Omit para evitar erros) ---
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
  // Se der erro aqui, mude para '/config-publica'
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
  const response = await apiClient.get('/admin/categories'); // Ou /admin/categorias se falhar
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

// ============================================================================
// Módulo: Upload de Imagens (CORRIGIDO - Firebase Direto)
// ============================================================================
export const uploadImage = async (file: File, folder: string = 'produtos'): Promise<string> => {
  if (!file) return '';
  
  try {
    // 1. Gera nome único
    const fileName = `${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase()}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);
    
    // 2. Faz o upload direto para o Firebase
    const snapshot = await uploadBytes(storageRef, file);
    
    // 3. Pega a URL pública
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Erro no upload Firebase:", error);
    throw new Error("Falha ao subir imagem. Verifique as chaves no .env.");
  }
};