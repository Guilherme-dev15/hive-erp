import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService, STATUS_UI_TO_PRISMA, STATUS_PRISMA_TO_UI } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, TransactionType } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: {
    order: { findMany: jest.Mock; findFirst: jest.Mock; update: jest.Mock; delete: jest.Mock };
    product: { update: jest.Mock; findFirst: jest.Mock };
    inventoryLog: { create: jest.Mock };
    transaction: { create: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      order: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      product: {
        update: jest.fn(),
        findFirst: jest.fn(),
      },
      inventoryLog: { create: jest.fn() },
      transaction: { create: jest.fn() },
      $transaction: jest.fn().mockImplementation((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Status Normalization', () => {
    it('normaliza status em português da UI para o Enum do Prisma', () => {
      expect(service.normalizeStatus('Aguardando Pagamento')).toBe(OrderStatus.AGUARDANDO_PAGAMENTO);
      expect(service.normalizeStatus('Em Separação')).toBe(OrderStatus.EM_SEPARACAO);
      expect(service.normalizeStatus('Enviado')).toBe(OrderStatus.ENVIADO);
      expect(service.normalizeStatus('Concluído')).toBe(OrderStatus.CONCLUIDO);
      expect(service.normalizeStatus('Cancelado')).toBe(OrderStatus.CANCELADO);
    });

    it('aceita valores de enum diretamente', () => {
      expect(service.normalizeStatus('CONCLUIDO')).toBe(OrderStatus.CONCLUIDO);
      expect(service.normalizeStatus(OrderStatus.ENVIADO)).toBe(OrderStatus.ENVIADO);
    });
  });

  describe('updateStatus & Circuito Financeiro', () => {
    const mockOrder = {
      id: 'ord-123',
      userId: 'user-1',
      customerName: 'Cliente Teste',
      status: OrderStatus.AGUARDANDO_PAGAMENTO,
      total: 150,
      financialRegistered: false,
      items: [
        {
          id: 'item-1',
          productId: 'prod-1',
          quantity: 2,
        },
      ],
    };

    it('ao transicionar para Concluído, registra venda no Financeiro e atualiza financialRegistered', async () => {
      prisma.order.findFirst.mockResolvedValue(mockOrder);
      prisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CONCLUIDO,
        financialRegistered: true,
      });

      const updated = await service.updateStatus('ord-123', 'Concluído' as any, 'user-1');

      expect(prisma.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          type: TransactionType.VENDA,
          amount: 150,
          orderId: 'ord-123',
        }),
      });
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'ord-123' },
        data: expect.objectContaining({
          status: OrderStatus.CONCLUIDO,
          financialRegistered: true,
        }),
        include: { items: true },
      });
    });

    it('ao cancelar pedido, restaura estoque e gera log de inventário', async () => {
      prisma.order.findFirst.mockResolvedValue(mockOrder);
      prisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELADO,
      });
      prisma.product.update.mockResolvedValue({
        id: 'prod-1',
        quantity: 7,
      });

      await service.updateStatus('ord-123', 'Cancelado' as any, 'user-1');

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { quantity: { increment: 2 } },
      });
      expect(prisma.inventoryLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          productId: 'prod-1',
          userId: 'user-1',
          change: 2,
          type: 'CANCELAMENTO_PEDIDO',
        }),
      });
    });
  });

  describe('findAll', () => {
    it('retorna pedidos formatados com status amigável para o frontend', async () => {
      prisma.order.findMany.mockResolvedValue([
        {
          id: 'ord-1',
          status: OrderStatus.AGUARDANDO_PAGAMENTO,
          total: 100,
          items: [],
        },
        {
          id: 'ord-2',
          status: OrderStatus.CONCLUIDO,
          total: 200,
          items: [],
        },
      ]);

      const list = await service.findAll('user-1');

      expect(list[0].status).toBe('Aguardando Pagamento');
      expect(list[1].status).toBe('Concluído');
    });
  });
});
