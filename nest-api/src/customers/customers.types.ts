export interface CustomerOrderSummary {
  id: string;
  total: number;
  status: string;
  createdAt: Date;
  itemsCount: number;
}

export interface CustomerSummary {
  id: string; // chave canônica (telefone normalizado ou fallback)
  name: string;
  phone: string;
  cleanPhone: string;
  totalOrders: number;
  totalSpent: number;
  averageTicket: number;
  firstOrderDate: Date;
  lastOrderDate: Date;
  lastOrderStatus: string;
  orders: CustomerOrderSummary[];
}

export interface CustomersQueryDto {
  search?: string;
  sortBy?: 'totalSpent' | 'totalOrders' | 'lastOrderDate' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface CustomersListResponse {
  data: CustomerSummary[];
  total: number;
  totalRevenue: number;
  averageTicketGlobal: number;
}
