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
  
  salePrice?: number;   
  marginPercent?: number; 
  status?: 'ativo' | 'inativo';
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

// A interface 'ProdutoAdmin' duplicada que estava aqui foi REMOVIDA.