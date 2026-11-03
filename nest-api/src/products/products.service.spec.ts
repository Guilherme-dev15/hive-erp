import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProductStatus } from '@prisma/client';

describe('ProductsService Bulk M3', () => {
  let service: ProductsService;
  let prisma: {
    product: { findMany: jest.Mock, findFirst: jest.Mock, create: jest.Mock, update: jest.Mock, updateMany: jest.Mock, delete: jest.Mock };
    category?: { findFirst: jest.Mock, findMany: jest.Mock, create: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      product: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      category: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
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

  describe('create', () => {
    it('deve criar produto resolvendo categoria automaticamente por nome', async () => {
      prisma.category!.findFirst.mockResolvedValue({ id: 'cat-correntes', name: 'CORRENTES', userId: 'tenant-a' });
      const createdProd = {
        id: 'prod-new',
        name: 'Corrente Veneziana',
        categoryId: 'cat-correntes',
        salePrice: 150,
        costPrice: 50,
        quantity: 5,
        status: ProductStatus.ATIVO,
        userId: 'tenant-a',
      };
      prisma.product.create.mockResolvedValue(createdProd);

      const result = await service.create(
        {
          name: 'Corrente Veneziana',
          category: 'CORRENTES',
          salePrice: 150,
          costPrice: 50,
          quantity: 5,
        },
        'tenant-a'
      );

      expect(result).toEqual(expect.objectContaining({ id: 'prod-new', name: 'Corrente Veneziana' }));
      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Corrente Veneziana',
            categoryId: 'cat-correntes',
            salePrice: 150,
            userId: 'tenant-a',
          }),
        })
      );
    });
  });

  describe('remove', () => {
    it('deve remover produto pertencente ao tenant', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'prod-1', userId: 'tenant-a' });
      prisma.product.delete.mockResolvedValue({ id: 'prod-1' });

      const result = await service.remove('prod-1', 'tenant-a');

      expect(result).toEqual({ success: true, id: 'prod-1' });
      expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: 'prod-1' } });
    });

    it('deve lançar NotFoundException se produto não pertencer ao tenant', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(service.remove('prod-1', 'tenant-b')).rejects.toThrow(NotFoundException);
      expect(prisma.product.delete).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('deve atualizar somente o produto pertencente ao tenant e retornar o produto', async () => {
      const updatedProduct = { id: 'prod-1', userId: 'tenant-a', name: 'Produto atualizado' };
      prisma.product.updateMany.mockResolvedValue({ count: 1 });
      prisma.product.findFirst.mockResolvedValue(updatedProduct);

      const res = await service.update('prod-1', { name: 'Produto atualizado' }, 'tenant-a');

      expect(res).toEqual(expect.objectContaining({ id: 'prod-1', name: 'Produto atualizado' }));
      expect(prisma.product.updateMany).toHaveBeenCalledWith({
        where: { id: 'prod-1', userId: 'tenant-a' },
        data: { name: 'Produto atualizado' }
      });
      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        where: { id: 'prod-1', userId: 'tenant-a' }
      });
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('deve retornar 404 sem consultar o produto quando o tenant não possui o id', async () => {
      prisma.product.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.update('prod-1', { name: 'Tentativa' }, 'tenant-b'))
        .rejects.toThrow(new NotFoundException('Produto não encontrado'));

      expect(prisma.product.updateMany).toHaveBeenCalledWith({
        where: { id: 'prod-1', userId: 'tenant-b' },
        data: { name: 'Tentativa' }
      });
      expect(prisma.product.findFirst).not.toHaveBeenCalled();
      expect(prisma.product.update).not.toHaveBeenCalled();
    });
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
