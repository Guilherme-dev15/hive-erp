export interface ProdutoVariante {
  id: string;
  sku_sufixo: string;
  valor_ajuste: number;
  medida: string | null;
  estoque: number;
  sob_consulta: boolean;
}

export interface ProdutoCatalogo {
  variantes: ProdutoVariante[];
  id: string;
  name: string;
  code?: string | null;
  category?: string | null;
  description?: string | null;
  salePrice: number;
  status?: 'ativo' | 'inativo';
  imageUrl?: string | null;
  quantity?: number;
  subcategory?: string | null;
  promotionalPrice?: number;
  isOnSale?: boolean;
}

export interface ConfigPublica {
  lowStockThreshold: number;
  whatsappNumber: string | null;
  storeName: string;
  primaryColor: string;
  secondaryColor: string;
  banners?: string[];
  slug?: string;
}

export interface PublicCatalogResponse {
  version: 'v1';
  data: {
    config: ConfigPublica;
    produtos: ProdutoCatalogo[];
    categorias: Array<{ id: string; name: string }>;
  };
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
  storeId?: string;
  status: string;
}
