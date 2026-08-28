import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: {
    inventoryLog: { findMany: jest.Mock };
    product: { findFirst: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      inventoryLog: { findMany: jest.fn() },
      product: { findFirst: jest.fn() },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLogs', () => {
    it('deve retornar os ultimos 20 logs de um produto (tenant isolado)', async () => {
      prisma.inventoryLog.findMany.mockResolvedValue([{ id: 'log1' }]);
      const res = await service.getLogs('prod-1', 'user-1');

      expect(prisma.inventoryLog.findMany).toHaveBeenCalledWith({
        where: { productId: 'prod-1', userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      expect(res).toEqual([{ id: 'log1' }]);
    });
  });

  describe('adjustInventory', () => {
    it('deve lançar NotFound se o produto não pertencer ao usuário', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      await expect(
        service.adjustInventory('prod-1', { type: 'entry', quantity: 10, userName: 'John' }, 'user-1')
      ).rejects.toThrow(NotFoundException);
    });

    it('deve realizar $transaction atômica incrementando (entry)', async () => {
      // Mock para a busca inicial
      prisma.product.findFirst.mockResolvedValue({ id: 'prod-1', quantity: 5 });

      // Mock do $transaction que injeta o delegate (tx)
      const mockTx = {
        product: { update: jest.fn().mockResolvedValue({ id: 'prod-1', quantity: 15 }) },
        inventoryLog: { create: jest.fn() }
      };
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      const dto: AdjustInventoryDto = { type: 'entry', quantity: 10, userName: 'John' };
      await service.adjustInventory('prod-1', dto, 'user-1');

      expect(mockTx.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { quantity: { increment: 10 } } // Delegação atômica para o banco
      });
      expect(mockTx.inventoryLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          productId: 'prod-1',
          type: 'entry',
          change: 10,
          newQuantity: 15, // resultado do update
          userName: 'John'
        }
      });
    });

    it('deve lançar BadRequest se (exit) estourar limite negativo (opcional/segurança)', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'prod-1', quantity: 5 });

      await expect(
        service.adjustInventory('prod-1', { type: 'exit', quantity: 10, userName: 'John' }, 'user-1')
      ).rejects.toThrow(BadRequestException);
    });
  });
});
