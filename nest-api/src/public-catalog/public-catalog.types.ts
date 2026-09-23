export interface PublicCatalogQuery {
  slug?: string;
}

export interface PublicCatalogConfig {
  storeName: string;
  slug: string;
  primaryColor: string;
  secondaryColor: string;
  whatsappNumber: string | null;
  banners: string[];
  lowStockThreshold: number;
}

export interface PublicCatalogVariant {
  id: string;
  sku_sufixo: string;
  valor_ajuste: number;
  medida: string | null;
  estoque: number;
  sob_consulta: boolean;
}

export interface PublicCatalogProduct {
  id: string;
  name: string;
  code: string | null;
  category: string | null;
  subcategory: string | null;
  description: string | null;
  salePrice: number;
  imageUrl: string | null;
  quantity: number;
  status: 'ativo';
  variantes: PublicCatalogVariant[];
}

export interface PublicCatalogCategory {
  id: string;
  name: string;
}

export interface PublicCatalogResponse {
  version: 'v1';
  data: {
    config: PublicCatalogConfig;
    produtos: PublicCatalogProduct[];
    categorias: PublicCatalogCategory[];
  };
}
