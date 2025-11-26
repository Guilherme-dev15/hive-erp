// Este ficheiro define a "forma" dos seus dados em toda a aplicação.

export interface ProdutoAdmin {
  id: string;
  name: string;
  code?: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  costPrice: number;    
  supplierId: string; 
  // --- NOVO CAMPO ---
  quantity: number; // Stock atual
  salePrice?: number;   
  marginPercent?: number; 
  status?: 'ativo' | 'inativo';
  supplierProductUrl?: string;
}

export interface Fornecedor {
  id: string;
  name: string;
  contactPhone?: string; // Telefone (opcional)
  url?: string; // Link do site (opcional)
  paymentTerms?: string; // Condições de pagamento (opcional)
}

export interface Transacao {
  id: string;
  type: 'venda' | 'despesa' | 'capital'; 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  date: any; // Vamos tratar a data como string (ex: "2025-10-31")
  amount: number; // Positivo para entradas (venda), negativo para saídas (despesa)
  description: string;
  
  productId?: string; // Opcional, para associar a um produto
}

export interface DashboardStats {
  totalVendas: number;
  totalDespesas: number; // (Será um valor negativo)
  lucroLiquido: number;
  saldoTotal: number;
}

export interface Category {
  id: string;
  name: string;
}

// O Status que um pedido pode ter
export type OrderStatus = 
  | 'Aguardando Pagamento' 
  | 'Em Produção' 
  | 'Em Separação' 
  | 'Enviado' 
  | 'Cancelado';

// Um item dentro de um pedido
export interface OrderLineItem {
  id: string; // O ID do produto
  name: string;
  code?: string;
  salePrice: number;
  quantidade: number;
}

// A estrutura do Pedido como salva no Firebase
export interface Order {
  id: string;
  createdAt: any; // Firestore Timestamp
  items: OrderLineItem[];
  subtotal: number;
  desconto: number;
  total: number;
  observacoes?: string;
  status: OrderStatus;
  financeiroRegistrado?: boolean;
}