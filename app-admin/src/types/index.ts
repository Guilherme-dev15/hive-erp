// ============================================================================
// TYPE DEFINITIONS (SINGLE SOURCE OF TRUTH)
// ============================================================================

// Tipo auxiliar para lidar com datas que podem vir como String (JSON), Date (JS) ou Timestamp (Firestore)
export type FirestoreDate = string | Date | { seconds: number; nanoseconds: number };

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
  weight: any;
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

export interface Fornecedor {
  rules: any;
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
  revenue: number;      // Faturamento total deste produto
  unitsSold: number;    // Unidades vendidas
  classification: 'A' | 'B' | 'C';
}