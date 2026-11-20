import axios from 'axios';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, storage } from './firebase/firebaseConfig';
import {
  ProdutoAdmin,
  Category,
  Fornecedor,
  Order as PedidoAdmin, // Renomeando para consistência
  Transacao,
  Coupon,
  ConfigFormData as Config,
  StockAdjustment,
  StockLog,
  ProdutoFormData,
  DashboardStats,
  ChartData,
  ABCReport,
  CustomerSummary,
  CustomersListResponse,
  BillingStatusResponse,
  CheckoutIntentResponse,
  ProductSetupRequestItem,
  SetupBatchTier,
  SetupRequestStatus,
  SubscriptionSummary,
  SuperAdminOverview,
  SuperAdminSetupRequestItem,
  SuperAdminSubscriptionAction,
  SuperAdminTenantItem,
} from '../types';


// ============================================================================
// CONFIGURAÇÃO DA CONEXÃO
// ============================================================================
// Os endpoints já incluem o prefixo `/api/v2`; normalize uma eventual base
// legada configurada como `https://hive-erp.vercel.app/api` para não gerar
// `/api/api/v2/...` em produção.
const configuredApiUrl = import.meta.env.VITE_API_URL;
const API_URL = configuredApiUrl?.replace(/\/api\/?$/, '') || '';

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

type SubscriptionExpiredHandler = (subscription?: SubscriptionSummary) => void;
let subscriptionExpiredHandler: SubscriptionExpiredHandler | null = null;

export const registerSubscriptionExpiredHandler = (
  handler: SubscriptionExpiredHandler | null
): (() => void) => {
  subscriptionExpiredHandler = handler;
  return () => {
    if (subscriptionExpiredHandler === handler) {
      subscriptionExpiredHandler = null;
    }
  };
};

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;
    if (status === 402 && data?.code === 'SUBSCRIPTION_EXPIRED') {
      subscriptionExpiredHandler?.(data.subscription);
    }
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
  const { data } = await apiClient.get<ProdutoAdmin[]>('/api/v2/products');
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
  const { data } = await apiClient.post('/api/v2/products', productData);
  return data;
};
export const updateAdminProduto = async (
  id: string,
  productData: Partial<ProdutoFormData>
): Promise<ProdutoAdmin> => {
  const { data } = await apiClient.put(`/api/v2/products/${id}`, productData);
  return data;
};
export const deleteAdminProduto = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/v2/products/${id}`);
};
export const importProductsBulk = async (
  products: Partial<ProdutoAdmin>[]
): Promise<{ count: number }> => {
  const { data } = await apiClient.post('/api/v2/products/bulk', products);
  return data;
};

// ============================================================================
// DOMÍNIO: PEDIDOS (GESTÃO DE VENDAS)
// ============================================================================
export const getAdminOrders = async (): Promise<PedidoAdmin[]> => {
  const { data } = await apiClient.get('/api/v2/orders');
  return data;
};
export const updateAdminOrderStatus = async (
  orderId: string,
  status: string
): Promise<PedidoAdmin> => {
  const { data } = await apiClient.patch(`/api/v2/orders/${orderId}/status`, {
    status,
  });
  return data;
};
export const deleteAdminOrder = async (orderId: string): Promise<void> => {
  await apiClient.delete(`/api/v2/orders/${orderId}`);
};

// ============================================================================
// DOMÍNIO: FINANCEIRO & TRANSAÇÕES
// ============================================================================
type ApiTransactionType = 'VENDA' | 'DESPESA' | 'CAPITAL';
type ApiTransaction = Omit<Transacao, 'type'> & {
  type: ApiTransactionType;
};

const toApiTransactionType = (
  type: Transacao['type']
): ApiTransactionType => {
  switch (type) {
    case 'despesa':
      return 'DESPESA';
    case 'capital':
      return 'CAPITAL';
    case 'venda':
    default:
      return 'VENDA';
  }
};

const fromApiTransactionType = (type: string): Transacao['type'] => {
  switch (type.toUpperCase()) {
    case 'DESPESA':
      return 'despesa';
    case 'CAPITAL':
      return 'capital';
    case 'VENDA':
    default:
      return 'venda';
  }
};

const normalizeTransaction = (transaction: ApiTransaction): Transacao => ({
  ...transaction,
  type: fromApiTransactionType(String(transaction.type)),
});

export const getTransacoes = async (): Promise<Transacao[]> => {
  const { data } = await apiClient.get<ApiTransaction[]>('/api/v2/transactions');
  return data.map(normalizeTransaction);
};
export const createTransacao = async (
  transacaoData: Omit<Transacao, 'id'>
): Promise<Transacao> => {
  const { data } = await apiClient.post<ApiTransaction>('/api/v2/transactions', {
    ...transacaoData,
    type: toApiTransactionType(transacaoData.type),
  });
  return normalizeTransaction(data);
};
export const updateTransacao = async (
  id: string,
  transacaoData: Partial<Transacao>
): Promise<Transacao> => {
  const { data } = await apiClient.put<ApiTransaction>(
    `/api/v2/transactions/${id}`,
    {
      ...transacaoData,
      ...(transacaoData.type
        ? { type: toApiTransactionType(transacaoData.type) }
        : {}),
    }
  );
  return normalizeTransaction(data);
};
export const deleteTransacao = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/v2/transactions/${id}`);
};

// ============================================================================
// DOMÍNIO: ESTOQUE (INVENTÁRIO)
// ============================================================================
export const adjustStock = async (
  adjustmentData: StockAdjustment
): Promise<{ success: boolean; message: string }> => {
  const { data } = await apiClient.post(
    '/api/v2/inventory/adjust',
    adjustmentData
  );
  return data;
};
export const getProductLogs = async (productId: string): Promise<StockLog[]> => {
  const { data } = await apiClient.get(`/api/v2/inventory/logs/${productId}`);
  return data;
};

// ============================================================================
// DOMÍNIO: FORNECEDORES & CATEGORIAS
// ============================================================================
export const getFornecedores = async (): Promise<Fornecedor[]> => {
  const { data } = await apiClient.get('/api/v2/suppliers');
  return data;
};
export const createFornecedor = async (
  fornecedorData: Omit<Fornecedor, 'id'>
): Promise<Fornecedor> => {
  const { data } = await apiClient.post('/api/v2/suppliers', fornecedorData);
  return data;
};
export const updateFornecedor = async (
  id: string,
  fornecedorData: Partial<Fornecedor>
): Promise<Fornecedor> => {
  const { data } = await apiClient.put(
    `/api/v2/suppliers/${id}`,
    fornecedorData
  );
  return data;
};
export const deleteFornecedor = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/v2/suppliers/${id}`);
};

export const getCategories = async (): Promise<Category[]> => {
  const { data } = await apiClient.get('/api/v2/categories');
  return data;
};
export const createCategory = async (
  categoryData: Omit<Category, 'id'>
): Promise<Category> => {
  const { data } = await apiClient.post('/api/v2/categories', categoryData);
  return data;
};
export const deleteCategory = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/v2/categories/${id}`);
};

// ============================================================================
// DOMÍNIO: MARKETING (CUPONS & CAMPANHAS)
// ============================================================================
export const getCoupons = async (): Promise<Coupon[]> => {
  const { data } = await apiClient.get('/api/v2/coupons');
  return data;
};
export const createCoupon = async (
  couponData: Omit<Coupon, 'id' | 'status'>
): Promise<Coupon> => {
  const { data } = await apiClient.post('/api/v2/coupons', couponData);
  return data;
};
export const deleteCoupon = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/v2/coupons/${id}`);
};

export const simulateCampaign = async (
  discount: number,
  minMarkup: number
): Promise<CampaignSimulation> => {
  const { data } = await apiClient.post<CampaignSimulation>(
    '/api/v2/campaign/simulate',
    { discount, minMarkup }
  );
  return data;
};
export const applyCampaign = async (
  discount: number,
  minMarkup: number,
  campaignName: string
): Promise<{ count: number }> => {
  const { data } = await apiClient.post('/api/v2/campaign/apply', { discount, minMarkup, campaignName });
  return data;
};
export const revertCampaign = async (): Promise<{ message: string }> => {
  const { data } = await apiClient.post('/api/v2/campaign/revert');
  return data;
};


// ============================================================================
// DOMÍNIO: DASHBOARD & CONFIGURAÇÕES GLOBAIS
// ============================================================================
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await apiClient.get('/api/v2/dashboard/stats');
  return data;
};
export const getChartData = async (): Promise<ChartData> => {
  const { data } = await apiClient.get('/api/v2/dashboard-charts');
  return data;
};
export const getABCReport = async (): Promise<ABCReport> => {
  const { data } = await apiClient.get('/api/v2/reports/abc');
  return data;
};

// ============================================================================
// DOMÍNIO: CLIENTES & CRM
// ============================================================================
export const getCustomers = async (query?: {
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}): Promise<CustomersListResponse> => {
  const { data } = await apiClient.get('/api/v2/customers', { params: query });
  return data;
};

export const getCustomer = async (
  idOrPhone: string
): Promise<CustomerSummary> => {
  const { data } = await apiClient.get(`/api/v2/customers/${idOrPhone}`);
  return data;
};

export const getConfig = async (): Promise<Config> => {
  const { data } = await apiClient.get('/api/v2/config');
  return data;
};
export const saveConfig = async (
  configData: Partial<Config>
): Promise<Config> => {
  const { data } = await apiClient.post('/api/v2/config', configData);
  return data;
};

// ==========================================
// M3: Novas APIs do NestJS (V2)
// ==========================================

export const updateBulkMarkup = async (categoryId: string, markup: number, globalGramPrice?: number) => {
  const { data } = await apiClient.post('/api/v2/products/bulk-markup', { categoryId, markup, globalGramPrice });
  return data;
};

export const updateBulkStatus = async (productIds: string[], status: 'ATIVO' | 'INATIVO') => {
  const { data } = await apiClient.post('/api/v2/products/bulk-status', { productIds, status });
  return data;
};

export const getTeamMembers = async () => {
  const { data } = await apiClient.get('/api/v2/team');
  return data;
};

export const inviteTeamMember = async (name: string, email: string) => {
  const { data } = await apiClient.post('/api/v2/team', { name, email });
  return data;
};

export const removeTeamMember = async (email: string) => {
  const { data } = await apiClient.delete(`/api/v2/team/${email}`);
  return data;
};

export interface OnboardData {
  storeName: string;
  name?: string;
  email?: string;
  slug?: string;
}

export const onboardMerchant = async (data: OnboardData) => {
  const response = await apiClient.post('/api/v2/auth/onboard', data);
  return response.data;
};

// ============================================================================
// DOMÍNIO: ASSINATURA SAAS, ORDER BUMP DE SETUP & SUPER-ADMIN (FASE B)
// ============================================================================
export const getBillingStatus = async (): Promise<BillingStatusResponse> => {
  const { data } = await apiClient.get<BillingStatusResponse>('/api/v2/billing/status');
  return data;
};

export const createBillingCheckoutIntent = async (payload: {
  setupBatchTier?: SetupBatchTier;
  contactPhone?: string;
  sourceDescription?: string;
}): Promise<CheckoutIntentResponse> => {
  const { data } = await apiClient.post<CheckoutIntentResponse>(
    '/api/v2/billing/checkout-intent',
    payload
  );
  return data;
};

export const createProductSetupRequest = async (payload: {
  batchTier: SetupBatchTier;
  includeMonthlyPlan?: boolean;
  contactPhone?: string;
  sourceDescription?: string;
}): Promise<
  ProductSetupRequestItem & {
    pix: BillingStatusResponse['catalog']['pix'];
    whatsappUrl: string | null;
  }
> => {
  const { data } = await apiClient.post('/api/v2/billing/setup-requests', payload);
  return data;
};

export const cancelProductSetupRequest = async (
  id: string
): Promise<ProductSetupRequestItem> => {
  const { data } = await apiClient.patch<ProductSetupRequestItem>(
    `/api/v2/billing/setup-requests/${id}/cancel`
  );
  return data;
};

export const getSuperAdminOverview = async (): Promise<SuperAdminOverview> => {
  const { data } = await apiClient.get<SuperAdminOverview>('/api/v2/super-admin/overview');
  return data;
};

export const getSuperAdminTenants = async (params?: {
  search?: string;
  status?: string;
}): Promise<SuperAdminTenantItem[]> => {
  const { data } = await apiClient.get<SuperAdminTenantItem[]>('/api/v2/super-admin/tenants', {
    params,
  });
  return data;
};

export const updateTenantSubscription = async (
  userId: string,
  payload: {
    action: SuperAdminSubscriptionAction;
    days?: number;
    isExempt?: boolean;
    amountCents?: number;
    note?: string;
  }
): Promise<{ userId: string; active: boolean; subscription: SubscriptionSummary }> => {
  const { data } = await apiClient.patch(
    `/api/v2/super-admin/tenants/${userId}/subscription`,
    payload
  );
  return data;
};

export const getSuperAdminSetupRequests = async (params?: {
  status?: string;
  search?: string;
}): Promise<SuperAdminSetupRequestItem[]> => {
  const { data } = await apiClient.get<SuperAdminSetupRequestItem[]>(
    '/api/v2/super-admin/setup-requests',
    { params }
  );
  return data;
};

export const updateSuperAdminSetupRequest = async (
  id: string,
  payload: {
    status: SetupRequestStatus;
    adminNotes?: string;
    importedCount?: number;
    activateMonthlyPlanToo?: boolean;
    monthlyDays?: number;
  }
): Promise<{
  setupRequest: ProductSetupRequestItem;
  activatedSubscription: SubscriptionSummary | null;
}> => {
  const { data } = await apiClient.patch(`/api/v2/super-admin/setup-requests/${id}`, payload);
  return data;
};

export const importProductsForTenant = async (
  userId: string,
  payload: {
    products: Partial<ProdutoAdmin>[];
    setupRequestId?: string;
  }
): Promise<{ count: number }> => {
  const { data } = await apiClient.post<{ count: number }>(
    `/api/v2/super-admin/tenants/${userId}/import-products`,
    payload
  );
  return data;
};


