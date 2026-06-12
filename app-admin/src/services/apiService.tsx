import axios from "axios";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, storage } from "../firebase/firebaseConfig";

// --- TYPES & SCHEMAS ---
import type {
  ProdutoAdmin,
  Fornecedor,
  Transacao,
  DashboardStats,
  Category,
  Order,
  Coupon,
  ABCProduct,
  ChartData,
} from "../types";

import type {
  ProdutoFormData,
  FornecedorFormData,
  ConfigFormData,
  TransacaoFormData,
} from "../types/schemas";

// ============================================================================
// CONFIGURAÇÃO DA CONEXÃO
// ============================================================================

const API_URL = import.meta.env.VITE_API_URL;

export const apiClient = axios.create({
  baseURL: API_URL,
});

// Interceptor para injetar o Token do Firebase em todas as chamadas
apiClient.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================================================
// SERVIÇO DE UPLOAD (FIREBASE STORAGE)
// ============================================================================

export const uploadImage = async (file: File): Promise<string> => {
  if (!file) return "";
  try {
    const cleanName = file.name.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
    const fileName = `products/${Date.now()}_${cleanName}`;
    const storageRef = ref(storage, fileName);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error("Erro no Upload:", error);
    throw new Error("Falha ao subir imagem.");
  }
};

// ============================================================================
// DOMÍNIO: PRODUTOS
// ============================================================================

export const getAdminProdutos = async (): Promise<ProdutoAdmin[]> => {
  const response = await apiClient.get("/admin/products");
  // Mapeamento de segurança para garantir integridade da UI
  return response.data.map((prod: any) => ({
    ...prod,
    variantes: prod.variantes || [],
    cm: prod.cm || "",
    mm: prod.mm || "",
  }));
};

export const createAdminProduto = async (
  data: ProdutoFormData,
): Promise<ProdutoAdmin> =>
  (await apiClient.post("/admin/products", data)).data;

export const updateAdminProduto = async (
  id: string,
  data: ProdutoFormData,
): Promise<ProdutoAdmin> =>
  (await apiClient.put(`/admin/products/${id}`, data)).data;

export const deleteAdminProduto = async (id: string): Promise<void> =>
  await apiClient.delete(`/admin/products/${id}`);

export const importProductsBulk = async (products: any[]): Promise<any> =>
  (await apiClient.post("/admin/products/bulk", products)).data;

// ============================================================================
// DOMÍNIO: PEDIDOS (GESTÃO DE VENDAS)
// ============================================================================

export const getAdminOrders = async (): Promise<Order[]> =>
  (await apiClient.get("/admin/orders")).data;

export const updateAdminOrderStatus = async (
  orderId: string,
  status: string,
): Promise<any> => {
  const response = await apiClient.patch(`/admin/orders/${orderId}/status`, {
    status,
  });
  return response.data;
};

export const deleteAdminOrder = async (orderId: string): Promise<void> => {
  await apiClient.delete(`/admin/orders/${orderId}`);
};

// ============================================================================
// DOMÍNIO: FINANCEIRO & TRANSAÇÕES
// ============================================================================

export const getTransacoes = async (): Promise<Transacao[]> =>
  (await apiClient.get("/admin/transactions")).data;

export const createTransacao = async (
  data: TransacaoFormData,
): Promise<Transacao> =>
  (await apiClient.post("/admin/transactions", data)).data;

export const updateTransacao = async (
  id: string,
  data: TransacaoFormData,
): Promise<Transacao> =>
  (await apiClient.put(`/admin/transactions/${id}`, data)).data;

export const deleteTransacao = async (id: string): Promise<void> =>
  await apiClient.delete(`/admin/transactions/${id}`);

// ============================================================================
// DOMÍNIO: ESTOQUE (INVENTÁRIO)
// ============================================================================

export const adjustStock = async (data: {
  productId: string;
  type: "entry" | "exit" | "loss";
  quantity: number;
  reason: string;
  userName: string;
}): Promise<any> => {
  const response = await apiClient.post("/admin/inventory/adjust", data);
  return response.data;
};

export const getProductLogs = async (productId: string): Promise<any> => {
  const response = await apiClient.get(`/admin/inventory/logs/${productId}`);
  return response.data;
};

// ============================================================================
// DOMÍNIO: FORNECEDORES & CATEGORIAS
// ============================================================================

export const getFornecedores = async (): Promise<Fornecedor[]> =>
  (await apiClient.get("/admin/suppliers")).data;

export const createFornecedor = async (
  data: FornecedorFormData,
): Promise<Fornecedor> => (await apiClient.post("/admin/suppliers", data)).data;

export const updateFornecedor = async (
  id: string,
  data: FornecedorFormData,
): Promise<Fornecedor> =>
  (await apiClient.put(`/admin/suppliers/${id}`, data)).data;

export const deleteFornecedor = async (id: string): Promise<void> =>
  await apiClient.delete(`/admin/suppliers/${id}`);

export const getCategories = async (): Promise<Category[]> =>
  (await apiClient.get("/admin/categories")).data;

export const createCategory = async (data: {
  name: string;
}): Promise<Category> => (await apiClient.post("/admin/categories", data)).data;

export const deleteCategory = async (id: string): Promise<void> =>
  await apiClient.delete(`/admin/categories/${id}`);

// ============================================================================
// DOMÍNIO: MARKETING (CUPONS & CAMPANHAS)
// ============================================================================

export const getCoupons = async (): Promise<Coupon[]> =>
  (await apiClient.get("/admin/coupons")).data;

export const createCoupon = async (data: {
  code: string;
  discountPercent: number;
}): Promise<Coupon> => (await apiClient.post("/admin/coupons", data)).data;

export const deleteCoupon = async (id: string): Promise<void> =>
  await apiClient.delete(`/admin/coupons/${id}`);

export const simulateCampaign = async (
  discountPercent: number,
  minMarkup: number,
): Promise<any> =>
  (
    await apiClient.post("/admin/campaign/simulate", {
      discountPercent,
      minMarkup,
    })
  ).data;

export const applyCampaign = async (
  discountPercent: number,
  minMarkup: number,
  campaignName: string,
): Promise<any> =>
  (
    await apiClient.post("/admin/campaign/apply", {
      discountPercent,
      minMarkup,
      campaignName,
    })
  ).data;

export const revertCampaign = async (): Promise<any> =>
  (await apiClient.post("/admin/campaign/revert")).data;

// ============================================================================
// DOMÍNIO: DASHBOARD & CONFIGURAÇÕES GLOBAIS
// ============================================================================

export const getDashboardStats = async (): Promise<DashboardStats> =>
  (await apiClient.get("/admin/dashboard-stats")).data;

export const getDashboardCharts = async (): Promise<ChartData> =>
  (await apiClient.get("/admin/dashboard-charts")).data;

export const getABCReport = async (): Promise<ABCProduct[]> =>
  (await apiClient.get("/admin/reports/abc")).data;

export const getConfig = async (): Promise<ConfigFormData> =>
  (await apiClient.get("/admin/config")).data;

export const saveConfig = async (data: ConfigFormData): Promise<any> =>
  (await apiClient.post("/admin/config", data)).data;
