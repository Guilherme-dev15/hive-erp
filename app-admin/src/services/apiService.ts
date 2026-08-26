import axios from 'axios';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, storage } from './firebase/firebaseConfig';
import {
  ProdutoAdmin,
  Categoria,
  Fornecedor,
  Order as PedidoAdmin, // Renomeando para consistência
  Transacao,
  Cupom,
  ConfigFormData as Config,
  StockAdjustment,
  StockLog,
  ProdutoFormData,
  DashboardStats,
  DashboardCharts,
  ABCReport,
} from '../types';


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
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================================================
// SERVIÇO DE UPLOAD (FIREBASE STORAGE)
// ============================================================================
export const uploadImage = async (file: File): Promise<string> => {
  if (!file) return '';
  try {
    const cleanName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
    const fileName = `products/${Date.now()}_${cleanName}`;
    const storageRef = ref(storage, fileName);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error('Erro no Upload:', error);
    throw new Error('Falha ao subir imagem.');
  }
};

// ============================================================================
// DOMÍNIO: PRODUTOS
// ============================================================================
export const getAdminProdutos = async (): Promise<ProdutoAdmin[]> => {
  const { data } = await apiClient.get<ProdutoAdmin[]>('/api/admin/products');
  return data.map((prod) => ({
    ...prod,
    variantes: prod.variantes || [],
    cm: prod.cm || '',
    mm: prod.mm || '',
  }));
};
export const createAdminProduto = async (
  productData: ProdutoFormData
): Promise<ProdutoAdmin> => {
  const { data } = await apiClient.post('/api/admin/products', productData);
  return data;
};
export const updateAdminProduto = async (
  id: string,
  productData: Partial<ProdutoFormData>
): Promise<ProdutoAdmin> => {
  const { data } = await apiClient.put(`/api/admin/products/${id}`, productData);
  return data;
};
export const deleteAdminProduto = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/admin/products/${id}`);
};
export const importProductsBulk = async (
  products: Partial<ProdutoAdmin>[]
): Promise<{ count: number }> => {
  const { data } = await apiClient.post('/api/admin/products/bulk', products);
  return data;
};

// ============================================================================
// DOMÍNIO: PEDIDOS (GESTÃO DE VENDAS)
// ============================================================================
export const getAdminOrders = async (): Promise<PedidoAdmin[]> => {
  const { data } = await apiClient.get('/api/admin/orders');
  return data;
};
export const updateAdminOrderStatus = async (
  orderId: string,
  status: string
): Promise<PedidoAdmin> => {
  const { data } = await apiClient.patch(`/api/admin/orders/${orderId}/status`, {
    status,
  });
  return data;
};
export const deleteAdminOrder = async (orderId: string): Promise<void> => {
  await apiClient.delete(`/api/admin/orders/${orderId}`);
};

// ============================================================================
// DOMÍNIO: FINANCEIRO & TRANSAÇÕES
// ============================================================================
export const getTransacoes = async (): Promise<Transacao[]> => {
  const { data } = await apiClient.get('/api/admin/transactions');
  return data;
};
export const createTransacao = async (
  transacaoData: Omit<Transacao, 'id'>
): Promise<Transacao> => {
  const { data } = await apiClient.post('/api/admin/transactions', transacaoData);
  return data;
};
export const updateTransacao = async (
  id: string,
  transacaoData: Partial<Transacao>
): Promise<Transacao> => {
  const { data } = await apiClient.put(
    `/api/admin/transactions/${id}`,
    transacaoData
  );
  return data;
};
export const deleteTransacao = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/admin/transactions/${id}`);
};

// ============================================================================
// DOMÍNIO: ESTOQUE (INVENTÁRIO)
// ============================================================================
export const adjustStock = async (
  adjustmentData: StockAdjustment
): Promise<{ success: boolean; message: string }> => {
  const { data } = await apiClient.post(
    '/api/admin/inventory/adjust',
    adjustmentData
  );
  return data;
};
export const getProductLogs = async (productId: string): Promise<StockLog[]> => {
  const { data } = await apiClient.get(`/api/admin/inventory/logs/${productId}`);
  return data;
};

// ============================================================================
// DOMÍNIO: FORNECEDORES & CATEGORIAS
// ============================================================================
export const getFornecedores = async (): Promise<Fornecedor[]> => {
  const { data } = await apiClient.get('/api/admin/suppliers');
  return data;
};
export const createFornecedor = async (
  fornecedorData: Omit<Fornecedor, 'id'>
): Promise<Fornecedor> => {
  const { data } = await apiClient.post('/api/admin/suppliers', fornecedorData);
  return data;
};
export const updateFornecedor = async (
  id: string,
  fornecedorData: Partial<Fornecedor>
): Promise<Fornecedor> => {
  const { data } = await apiClient.put(
    `/api/admin/suppliers/${id}`,
    fornecedorData
  );
  return data;
};
export const deleteFornecedor = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/admin/suppliers/${id}`);
};

export const getCategories = async (): Promise<Categoria[]> => {
  const { data } = await apiClient.get('/api/admin/categories');
  return data;
};
export const createCategory = async (
  categoryData: Omit<Categoria, 'id'>
): Promise<Categoria> => {
  const { data } = await apiClient.post('/api/admin/categories', categoryData);
  return data;
};
export const deleteCategory = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/admin/categories/${id}`);
};

// ============================================================================
// DOMÍNIO: MARKETING (CUPONS & CAMPANHAS)
// ============================================================================
export const getCoupons = async (): Promise<Cupom[]> => {
  const { data } = await apiClient.get('/api/admin/coupons');
  return data;
};
export const createCoupon = async (
  couponData: Omit<Cupom, 'id' | 'status'>
): Promise<Cupom> => {
  const { data } = await apiClient.post('/api/admin/coupons', couponData);
  return data;
};
export const deleteCoupon = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/admin/coupons/${id}`);
};

export const simulateCampaign = async (
  discount: number,
  minMarkup: number
): Promise<CampaignSimulation> => {
  const { data } = await apiClient.post<CampaignSimulation>(
    '/api/admin/campaign/simulate',
    { discount, minMarkup }
  );
  return data;
};
export const applyCampaign = async (
  discount: number,
  minMarkup: number,
  campaignName: string
): Promise<{ count: number }> => {
  const { data } = await apiClient.post('/api/admin/campaign/apply', { discount, minMarkup, campaignName });
  return data;
};
export const revertCampaign = async (): Promise<{ message: string }> => {
  const { data } = await apiClient.post('/api/admin/campaign/revert');
  return data;
};


// ============================================================================
// DOMÍNIO: DASHBOARD & CONFIGURAÇÕES GLOBAIS
// ============================================================================
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await apiClient.get('/api/admin/dashboard/stats');
  return data;
};
export const getDashboardCharts = async (): Promise<DashboardCharts> => {
  const { data } = await apiClient.get('/api/admin/dashboard-charts');
  return data;
};
export const getABCReport = async (): Promise<ABCReport> => {
  const { data } = await apiClient.get('/api/admin/reports/abc');
  return data;
};

export const getConfig = async (): Promise<Config> => {
  const { data } = await apiClient.get('/api/admin/config');
  return data;
};
export const saveConfig = async (
  configData: Partial<Config>
): Promise<Config> => {
  const { data } = await apiClient.post('/api/admin/config', configData);
  return data;
};
