import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProductStatus } from '@prisma/client';

describe('ProductsService Bulk M3', () => {
  let service: ProductsService;
  let prisma: {
    product: { findMany: jest.Mock, update: jest.Mock, updateMany: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      product: {
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn()
      },
      $transaction: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('updateBulkMarkup', () => {
    it('deve precificar com base no PESO e globalGramPrice se disponiveis (Produto Fabricacao Propria)', async () => {
      // Setup
      prisma.product.findMany.mockResolvedValue([
        { id: 'prod-1', salePrice: 10, weight: 2.5, costPrice: 0 }
      ]);
      prisma.product.update.mockReturnValue('promise-update-1');
      prisma.$transaction.mockResolvedValue(['promise-update-1']);

      // Acao
      // formula: 2.5 (peso) * 4 (gramPrice) * 3 (markup) = 30
      await service.updateBulkMarkup({ categoryId: 'cat-1', markup: 3, globalGramPrice: 4 }, 'user-1');

      // Assert
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { marginPercent: 3, salePrice: 30 }
      });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('deve precificar com base no CUSTO se peso ou gramPrice forem zero (Produto Terceirizado)', async () => {
      prisma.product.findMany.mockResolvedValue([
        { id: 'prod-2', salePrice: 10, weight: 0, costPrice: 50 }
      ]);
      prisma.product.update.mockReturnValue('promise-update-2');
      prisma.$transaction.mockResolvedValue(['promise-update-2']);

      // Acao
      // formula: 50 (costPrice) * 2 (markup) = 100
      await service.updateBulkMarkup({ categoryId: 'cat-1', markup: 2 }, 'user-1');

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-2' },
        data: { marginPercent: 2, salePrice: 100 }
      });
    });

    it('deve MANTER o salePrice antigo se o produto nao tiver custo nem peso', async () => {
      prisma.product.findMany.mockResolvedValue([
        { id: 'prod-3', salePrice: 150, weight: 0, costPrice: 0 }
      ]);
      prisma.product.update.mockReturnValue('promise-update-3');
      prisma.$transaction.mockResolvedValue(['promise-update-3']);

      await service.updateBulkMarkup({ categoryId: 'cat-1', markup: 2 }, 'user-1');

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-3' },
        data: { marginPercent: 2, salePrice: 150 }
      });
    });
  });

  describe('updateBulkStatus', () => {
    it('deve despachar updateMany com a lista de ids e o status exigido', async () => {
      prisma.product.updateMany.mockResolvedValue({ count: 2 });

      const res = await service.updateBulkStatus({ productIds: ['prod-1', 'prod-2'], status: ProductStatus.INATIVO }, 'user-1');

      expect(res.updatedCount).toBe(2);
      expect(prisma.product.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          OR: [
            { id: { in: ['prod-1', 'prod-2'] } },
            { legacyId: { in: ['prod-1', 'prod-2'] } }
          ]
        },
        data: { status: 'INATIVO' }
      });
    });
  });
});
