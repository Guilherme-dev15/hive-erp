// ============================================================================
// TYPE DEFINITIONS (SINGLE SOURCE OF TRUTH)
// ============================================================================

// Tipo auxiliar para lidar com datas que podem vir como String (JSON), Date (JS) ou Timestamp (Firestore)
export type FirestoreDate =
  | string
  | Date
  | { seconds: number; nanoseconds: number };

// ============================================================================
// 1. DASHBOARD & GRÁFICOS (Essencial para a DashboardPage)
// ============================================================================

export interface DashboardStats {
  totalVendas: number;
  totalDespesas: number;
  lucroLiquido: number;
  saldoTotal: number;
  activeProducts: number;
}

export interface ChartData {
  salesByDay: { name: string; vendas: number }[];
  incomeVsExpense: { name: string; value: number }[];
}

// ============================================================================
// 2. PRODUTOS (Inventory)
// ============================================================================

export interface ProdutoAdmin {
  weight: number;
  id: string;
  name: string;
  code?: string;
  category: string;
  description?: string;
  imageUrl?: string;

  // Financeiro
  costPrice: number;
  salePrice: number;
  marginPercent?: number;

  // Estoque e Status
  quantity: number;
  status: 'ativo' | 'inativo';

  // Fornecedor
  supplierId?: string;
  supplierProductUrl?: string;

  // Metadados
  createdAt?: FirestoreDate;
  variantes?: ProdutoVariante[];
  cm?: string;
  mm?: string;
}

export interface ProdutoVariante {
  id?: string;
  sku_sufixo: string; // Ex: -40CM, -50CM, -N18
  valor_ajuste: number; // Valor a somar ou o preço cheio da variante
  medida: string; // 40cm, 50cm, ou Número 18
  estoque: number;
  sob_consulta: boolean;
}
// ============================================================================
// 3. PEDIDOS (Orders)
// ============================================================================

export type OrderStatus =
  | 'Aguardando Pagamento'
  | 'Em Produção'
  | 'Em Separação'
  | 'Enviado'
  | 'Concluído'
  | 'Cancelado';

export interface OrderLineItem {
  quantidade: number;
  id: string;
  name: string;
  code?: string;
  salePrice: number;
  quantity: number; // Padronizado para Inglês (era quantidade)
  imageUrl?: string;
}

export interface Order {
  id: string;
  createdAt: FirestoreDate;
  status: OrderStatus;

  // Cliente
  customerName: string;
  customerPhone: string;

  // Carrinho e Totais
  items: OrderLineItem[];
  subtotal: number;
  discount: number;
  total: number;

  // Detalhes
  notes?: string;
  financialRegistered?: boolean;
}

// ============================================================================
// 4. FINANCEIRO (Transactions)
// ============================================================================

export interface Transacao {
  id: string;
  type: 'venda' | 'despesa' | 'capital';
  date: FirestoreDate;
  amount: number;
  description: string;
  category?: string; // Adicionado para categorizar despesas no Gráfico
  productId?: string;
  orderId?: string;
}

// ============================================================================
// 5. CADASTROS AUXILIARES (Suppliers, Categories, Coupons)
// ============================================================================

export interface SupplierRules {
  isByWeight: boolean;
  lots?: Array<{
    weight: number;
    price: number;
  }>;
}

export interface Fornecedor {
  rules: SupplierRules;
  id: string;
  name: string;
  contactPhone?: string;
  url?: string;
  paymentTerms?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
  status: 'ativo' | 'inativo';
}

// ============================================================================
// 6. RELATÓRIOS
// ============================================================================

export interface ABCProduct extends ProdutoAdmin {
  revenue: number; // Faturamento total deste produto
  unitsSold: number; // Unidades vendidas
  classification: 'A' | 'B' | 'C';
}

export interface CampaignSimulation {
  simulatedCount: number;
  affectedProducts: Array<{
    id: string;
    name: string;
    originalPrice: number;
    newPrice: number;
  }>;
  estimatedImpact: number;
}
// (Added inside index.ts)
export interface ABCReportItem {
  id: string;
  name: string;
  quantity: number;
  salePrice: number;
  costPrice: number;
  valorEstoque: number;
  custoEstoque: number;
  lucroProjetado: number;
  classificacao: 'A' | 'B' | 'C';
}

export interface ABCReport {
  curvaABC: ABCReportItem[];
  summary: {
    totalRevenue: number;
    totalCost: number;
    projectedProfit: number;
    averageTicket: number;
  };
  resumoEstoque?: { // Mantendo por retrocompatibilidade se o frontend atual usa
    totalItens: number;
    valorTotal: number;
    produtosZerados: number;
  };
}

export interface CustomerOrderSummary {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  itemsCount: number;
}

export interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  cleanPhone: string;
  totalOrders: number;
  totalSpent: number;
  averageTicket: number;
  firstOrderDate: string;
  lastOrderDate: string;
  lastOrderStatus: string;
  orders: CustomerOrderSummary[];
}

export interface CustomersListResponse {
  data: CustomerSummary[];
  total: number;
  totalRevenue: number;
  averageTicketGlobal: number;
}

// ============================================================================
// 7. ASSINATURA SAAS, ORDER BUMP DE SETUP & SUPER-ADMIN (FASE B)
// ============================================================================

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELED';

export type SetupBatchTier = 'UP_TO_200' | 'UP_TO_300' | 'UP_TO_500';

export type SetupRequestStatus =
  | 'PENDING'
  | 'PAID'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED';

export type SuperAdminSubscriptionAction =
  | 'ACTIVATE_MONTHLY'
  | 'EXTEND_TRIAL'
  | 'GRANT_DAYS'
  | 'SET_EXEMPT'
  | 'EXPIRE_NOW'
  | 'CANCEL'
  | 'SUSPEND_ACCOUNT'
  | 'REACTIVATE_ACCOUNT';

export interface SubscriptionSummary {
  status: SubscriptionStatus;
  effectiveStatus: SubscriptionStatus;
  isBlocked: boolean;
  isExempt: boolean;
  planCode: string;
  monthlyPriceCents: number;
  trialStartsAt: string;
  trialEndsAt: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  daysRemaining: number | null;
}

export interface SetupBatchOption {
  tier: SetupBatchTier;
  label: string;
  description: string;
  maxProducts: number;
  priceCents: number;
}

export interface BillingCatalogSummary {
  trialDays: number;
  monthlyPlan: {
    code: string;
    name: string;
    priceCents: number;
    description: string;
  };
  setupBatches: SetupBatchOption[];
  pix: {
    configured: boolean;
    key: string | null;
    keyType: string | null;
    beneficiary: string | null;
  };
  supportWhatsapp: string | null;
}

export interface ProductSetupRequestItem {
  id: string;
  batchTier: SetupBatchTier;
  maxProducts: number;
  priceCents: number;
  includeMonthlyPlan: boolean;
  monthlyPlanPriceCents: number;
  totalPriceCents: number;
  status: SetupRequestStatus;
  referenceCode: string;
  contactPhone: string | null;
  sourceDescription: string | null;
  whatsappMessage: string | null;
  adminNotes: string | null;
  importedCount: number | null;
  paidAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillingEventItem {
  id: string;
  action: string;
  amountCents: number | null;
  daysGranted: number | null;
  referenceCode: string | null;
  note: string | null;
  createdAt: string;
}

export interface BillingStatusResponse {
  subscription: SubscriptionSummary;
  catalog: BillingCatalogSummary;
  setupRequests: ProductSetupRequestItem[];
  recentBillingEvents: BillingEventItem[];
}

export interface CheckoutIntentResponse {
  referenceCode: string;
  monthlyPlanPriceCents: number;
  setupBatchTier: SetupBatchTier | null;
  setupBatchMaxProducts: number | null;
  setupPriceCents: number;
  totalPriceCents: number;
  pix: BillingCatalogSummary['pix'];
  supportWhatsapp: string | null;
  whatsappMessage: string;
  whatsappUrl: string | null;
  setupRequestId: string | null;
}

export interface SuperAdminOverview {
  totalTenants: number;
  trialTenants: number;
  activePaidTenants: number;
  exemptTenants: number;
  expiredOrCanceledTenants: number;
  suspendedTenants: number;
  pendingSetupRequests: number;
  inProgressSetupRequests: number;
  completedSetupRequests: number;
  estimatedMrrCents: number;
  setupRevenueCents: number;
}

export interface SuperAdminTenantItem {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
  storeName: string;
  slug: string | null;
  whatsappNumber: string | null;
  productsCount: number;
  ordersCount: number;
  openSetupRequestsCount: number;
  subscription: SubscriptionSummary;
}

export interface SuperAdminSetupRequestItem extends ProductSetupRequestItem {
  userId: string;
  storeName: string;
  slug: string | null;
  ownerName: string;
  ownerEmail: string;
  storeWhatsapp: string | null;
}



