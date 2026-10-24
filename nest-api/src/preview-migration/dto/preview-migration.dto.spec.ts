import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PreviewMigrationProductDto } from './preview-migration.dto';

describe('PreviewMigrationProductDto', () => {
  const validProduct = {
    legacyId: 'product-1',
    name: 'Produto sintético',
    salePrice: 10,
    quantity: 1,
    status: 'ATIVO',
  };

  const variant = (index: number) => ({
    skuSuffix: `SKU-${index}`,
    stock: 1,
  });

  it('accepts up to 20 variants', async () => {
    const dto = plainToInstance(PreviewMigrationProductDto, {
      ...validProduct,
      variants: Array.from({ length: 20 }, (_, index) => variant(index)),
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects more than 20 variants', async () => {
    const dto = plainToInstance(PreviewMigrationProductDto, {
      ...validProduct,
      variants: Array.from({ length: 21 }, (_, index) => variant(index)),
    });

    const errors = await validate(dto);
    expect(errors.map((error) => error.property)).toContain('variants');
  });
});
