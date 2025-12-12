import axios from 'axios';
// 1. Imports do Firebase Authentication
import { auth } from '../firebaseConfig'; 

// 2. Imports do Firebase Storage (Correção dos erros 'ref', 'storage')
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeApp } from "firebase/app";

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
} from '../types'; // Removido .ts (não necessário)

import type { 
  ProdutoFormData, 
  FornecedorFormData, 
  ConfigFormData, 
  TransacaoFormData
} from '../types/schemas'; // Removido .ts

// ============================================================================
// Configuração do Firebase Storage (Para Upload de Imagens)
// ============================================================================
const firebaseConfig = {
  // Use as mesmas chaves do seu firebaseConfig.ts
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, // Essencial!
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Inicializa o app secundário apenas para o Storage (se necessário)
// Ou usa o 'app' já exportado do firebaseConfig se preferir, mas aqui garantimos isolamento
const app = initializeApp(firebaseConfig, "StorageApp");
const storage = getStorage(app);

// ============================================================================
// Configuração da API Axios
// ============================================================================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

// --- TIPAGEM DA CONFIGURAÇÃO (Corrigida com lowStockThreshold) ---
export interface AppConfig extends Omit<ConfigFormData, 'warrantyText' | 'lowStockThreshold' | 'banners'> {
  // 1. Redefinições Obrigatórias
  banners: string[]; // Garante que é array de strings
  cardFee: number;
  packagingCost: number;
  secondaryColor: string;
  primaryColor: string;
  storeName: string;
  
  // 2. Agora podemos definir como OPCIONAIS (?) sem gerar erro de conflito
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
  const response = await apiClient.get('/admin/products'); // Corrigido para /products (padrão REST)
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

// ============================================================================
// Módulo: Fornecedores
// ============================================================================
export const getFornecedores = async (): Promise<Fornecedor[]> => {
  const response = await apiClient.get('/admin/suppliers'); // Corrigido rota
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
  const response = await apiClient.get('/config-publica'); // Usando a rota pública para leitura
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
  const response = await apiClient.get('/categories'); // Rota padrão
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
// Módulo: Gráficos e Relatórios
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
// Módulo: Upload de Imagens (Firebase)
// ============================================================================
export const uploadImage = async (file: File, folder: string = 'produtos'): Promise<string> => {
  if (!file) return '';
  
  try {
    // Cria uma referência única: produtos/timestamp_nomearquivo
    const fileName = `${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase()}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);
    
    // Faz o upload
    const snapshot = await uploadBytes(storageRef, file);
    
    // Pega a URL pública
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Erro no upload Firebase:", error);
    throw new Error("Falha ao subir imagem. Verifique a configuração do Firebase.");
  }
};