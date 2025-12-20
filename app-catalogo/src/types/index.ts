/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ProdutoCatalogo {
  variantes: any;
  id: string;
  name: string;
  code?: string;
  category?: string;
  description?: string;
  salePrice: number;
  costPrice?: number;
  status?: 'ativo' | 'inativo';
  imageUrl?: string;
  quantity?: number;
  subcategory?: string;
}

export interface ConfigPublica {
  whatsappNumber: string | null;
  storeName: string;
  primaryColor: string;
  secondaryColor: string;
  banners?: string[];
}

export interface ItemCarrinho {
  produto: ProdutoCatalogo;
  quantidade: number;
}

export interface OrderItemPayload {
  id: string;
  name: string;
  code?: string;
  salePrice: number;
  quantidade: number;
}

export interface OrderPayload {
  customerName: string;
  customerPhone: string;
  items: OrderItemPayload[];
  subtotal: number;
  discount: number;
  total: number;
  notes: string;
}