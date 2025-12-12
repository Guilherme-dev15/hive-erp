import axios from 'axios';
// 1. Imports do Firebase Authentication
import { auth } from '../firebaseConfig'; 

// 2. Imports do Firebase Storage
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- TIPOS ---
import type { 
  ProdutoAdmin, Fornecedor, Transacao, DashboardStats, Category, Order, OrderStatus, Coupon, ABCProduct 
} from '../types';
import type { ProdutoFormData, FornecedorFormData, ConfigFormData, TransacaoFormData } from '../types/schemas';

// ============================================================================
// CONFIGURAÇÃO FIREBASE STORAGE
// ============================================================================
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const storageApp = initializeApp(firebaseConfig, "StorageApp");
const storage = getStorage(storageApp);

// ============================================================================
// CONFIGURAÇÃO API
// ============================================================================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({ baseURL: API_URL });

apiClient.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Tipagem Config (Blindada)
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
// ROTAS CORRIGIDAS (VOLTANDO AO PORTUGUÊS PARA CASAR COM API)
// ============================================================================

// --- PRODUTOS (Era /products, voltou para /produtos) ---
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

// --- FORNECEDORES (Era /suppliers, voltou para /fornecedores) ---
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

// --- CATEGORIAS (Era /categories, verifique se sua API usa /categories ou /admin/categories) ---
// Mantive /categories pois geralmente é rota pública compartilhada, 
// mas se der erro mude para /admin/categorias
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

// --- FINANCEIRO ---
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

// --- UPLOAD DE IMAGEM (FIREBASE DIRETO - MANTIDO PORQUE FUNCIONA) ---
export const uploadImage = async (file: File, folder: string = 'produtos'): Promise<string> => {
  if (!file) return '';
  try {
    const fileName = `${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase()}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Erro no upload Firebase:", error);
    throw new Error("Falha ao subir imagem. Verifique configuração do Firebase.");
  }
};

// --- OUTROS ---
export const getDashboardStats = async (): Promise<DashboardStats> => (await apiClient.get('/admin/dashboard-stats')).data;
export const getDashboardCharts = async () => (await apiClient.get('/admin/dashboard-charts')).data;
export const getAdminOrders = async (): Promise<Order[]> => (await apiClient.get('/admin/orders')).data;
export const updateAdminOrderStatus = async (id: string, status: OrderStatus) => (await apiClient.put(`/admin/orders/${id}`, { status })).data;
export const getConfig = async (): Promise<AppConfig> => (await apiClient.get('/config-publica')).data;
export const saveConfig = async (config: ConfigFormData) => (await apiClient.post('/admin/config', config)).data;
export const getCoupons = async () => (await apiClient.get('/admin/coupons')).data;
export const createCoupon = async (data: any) => (await apiClient.post('/admin/coupons', data)).data;
export const deleteCoupon = async (id: string) => await apiClient.delete(`/admin/coupons/${id}`);
export const getABCReport = async () => (await apiClient.get('/admin/reports/abc')).data;