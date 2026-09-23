import { ProductStatus } from '@prisma/client';
import { mapPublicCatalog } from './public-catalog.mapper';

describe('public catalog mapper', () => {
  it('serializes only storefront fields and normalizes Prisma values', () => {
    const result = mapPublicCatalog(
      {
        storeName: 'Hive',
        publicSlug: 'hive',
        primaryColor: '#D4AF37',
        secondaryColor: '#343434',
        whatsappNumber: null,
        banners: ['https://example.com/banner.png', { invalid: true }],
        lowStockThreshold: 5,
      },
      [
        {
          id: 'product-1',
          name: 'Produto',
          code: 'P-1',
          categoryId: 'category-1',
          subcategory: 'Anéis',
          description: 'Descrição pública',
          salePrice: { toString: () => '19.90' },
          imageUrl: null,
          quantity: 3,
          status: ProductStatus.ATIVO,
          variants: [
            {
              id: 'variant-1',
              skuSuffix: '-18',
              adjustmentValue: { toString: () => '2.50' },
              measurement: '18',
              stock: 2,
              onDemand: false,
            },
          ],
        },
      ],
      [{ id: 'category-1', name: 'Anéis' }],
    );

    expect(result).toEqual({
      version: 'v1',
      data: {
        config: {
          storeName: 'Hive',
          slug: 'hive',
          primaryColor: '#D4AF37',
          secondaryColor: '#343434',
          whatsappNumber: null,
          banners: ['https://example.com/banner.png'],
          lowStockThreshold: 5,
        },
        produtos: [
          {
            id: 'product-1',
            name: 'Produto',
            code: 'P-1',
            category: 'Anéis',
            subcategory: 'Anéis',
            description: 'Descrição pública',
            salePrice: 19.9,
            imageUrl: null,
            quantity: 3,
            status: 'ativo',
            variantes: [
              {
                id: 'variant-1',
                sku_sufixo: '-18',
                valor_ajuste: 2.5,
                medida: '18',
                estoque: 2,
                sob_consulta: false,
              },
            ],
          },
        ],
        categorias: [{ id: 'category-1', name: 'Anéis' }],
      },
    });

    expect(JSON.stringify(result)).not.toContain('costPrice');
    expect(JSON.stringify(result)).not.toContain('userId');
  });
});
