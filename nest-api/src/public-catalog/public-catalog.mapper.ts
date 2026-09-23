import { ProductStatus } from '@prisma/client';
import {
  PublicCatalogCategory,
  PublicCatalogConfig,
  PublicCatalogProduct,
  PublicCatalogResponse,
  PublicCatalogVariant,
} from './public-catalog.types';

type PublicConfigRecord = {
  storeName: string;
  publicSlug: string;
  primaryColor: string;
  secondaryColor: string;
  whatsappNumber: string | null;
  banners: unknown;
  lowStockThreshold: number;
};

type PublicVariantRecord = {
  id: string;
  skuSuffix: string;
  adjustmentValue: unknown;
  measurement: string | null;
  stock: number;
  onDemand: boolean;
};

type PublicProductRecord = {
  id: string;
  name: string;
  code: string | null;
  subcategory: string | null;
  description: string | null;
  salePrice: unknown;
  imageUrl: string | null;
  quantity: number;
  status: ProductStatus;
  categoryId: string | null;
  variants: PublicVariantRecord[];
};

const toNumber = (value: unknown): number => {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const toBanners = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((banner): banner is string => typeof banner === 'string' && banner.length > 0)
    : [];

export const mapPublicConfig = (config: PublicConfigRecord): PublicCatalogConfig => ({
  storeName: config.storeName,
  slug: config.publicSlug,
  primaryColor: config.primaryColor,
  secondaryColor: config.secondaryColor,
  whatsappNumber: config.whatsappNumber,
  banners: toBanners(config.banners),
  lowStockThreshold: config.lowStockThreshold,
});

export const mapPublicVariant = (variant: PublicVariantRecord): PublicCatalogVariant => ({
  id: variant.id,
  sku_sufixo: variant.skuSuffix,
  valor_ajuste: toNumber(variant.adjustmentValue),
  medida: variant.measurement,
  estoque: variant.stock,
  sob_consulta: variant.onDemand,
});

export const mapPublicProduct = (
  product: PublicProductRecord,
  categoryName: string | null,
): PublicCatalogProduct => ({
  id: product.id,
  name: product.name,
  code: product.code,
  category: categoryName,
  subcategory: product.subcategory,
  description: product.description,
  salePrice: toNumber(product.salePrice),
  imageUrl: product.imageUrl,
  quantity: product.quantity,
  status: 'ativo',
  variantes: product.variants.map(mapPublicVariant),
});

export const mapPublicCategory = (category: { id: string; name: string }): PublicCatalogCategory => ({
  id: category.id,
  name: category.name,
});

export const mapPublicCatalog = (
  config: PublicConfigRecord,
  products: PublicProductRecord[],
  categories: Array<{ id: string; name: string }>,
): PublicCatalogResponse => {
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));

  return {
    version: 'v1',
    data: {
      config: mapPublicConfig(config),
      produtos: products.map((product) =>
        mapPublicProduct(product, product.categoryId ? categoryNames.get(product.categoryId) ?? null : null),
      ),
      categorias: categories.map(mapPublicCategory),
    },
  };
};
