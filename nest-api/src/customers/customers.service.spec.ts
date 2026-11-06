import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

describe('CustomersService', () => {
  let service: CustomersService;
  let prisma: {
    order: { findMany: jest.Mock };
  };

  const mockOrders = [
    {
      id: 'order-1',
      userId: 'tenant-1',
      customerName: 'Maria Silva',
      customerPhone: '11988887777',
      status: OrderStatus.CONCLUIDO,
      total: 250.0,
      createdAt: new Date('2026-11-01T10:00:00Z'),
      items: [{ id: 'item-1' }, { id: 'item-2' }],
    },
    {
      id: 'order-2',
      userId: 'tenant-1',
      customerName: 'Maria Silva',
      customerPhone: '(11) 98888-7777', // mesmo telefone com formatação diferente
      status: OrderStatus.AGUARDANDO_PAGAMENTO,
      total: 150.0,
      createdAt: new Date('2026-11-03T14:30:00Z'),
      items: [{ id: 'item-3' }],
    },
    {
      id: 'order-3',
      userId: 'tenant-1',
      customerName: 'João Santos',
      customerPhone: '21977776666',
      status: OrderStatus.PAGO,
      total: 500.0,
      createdAt: new Date('2026-11-02T12:00:00Z'),
      items: [{ id: 'item-4' }, { id: 'item-5' }, { id: 'item-6' }],
    },
  ];

  beforeEach(async () => {
    prisma = {
      order: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('retorna lista vazia e métricas zeradas quando não há pedidos', async () => {
      prisma.order.findMany.mockResolvedValue([]);

      const result = await service.findAll('tenant-1');

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: { userId: 'tenant-1' },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalRevenue).toBe(0);
      expect(result.averageTicketGlobal).toBe(0);
    });

    it('agrupa pedidos por telefone normalizado e calcula LTV e ticket médio', async () => {
      prisma.order.findMany.mockResolvedValue(mockOrders);

      const result = await service.findAll('tenant-1');

      expect(result.total).toBe(2); // Maria e João
      expect(result.totalRevenue).toBe(900.0); // 250 + 150 + 500
      expect(result.averageTicketGlobal).toBe(300.0); // 900 / 3 pedidos

      // Maria Silva tem 2 pedidos agrupados
      const maria = result.data.find((c) => c.cleanPhone === '11988887777');
      expect(maria).toBeDefined();
      expect(maria?.totalOrders).toBe(2);
      expect(maria?.totalSpent).toBe(400.0);
      expect(maria?.averageTicket).toBe(200.0);
      expect(maria?.orders.length).toBe(2);

      // João Santos tem 1 pedido
      const joao = result.data.find((c) => c.cleanPhone === '21977776666');
      expect(joao).toBeDefined();
      expect(joao?.totalOrders).toBe(1);
      expect(joao?.totalSpent).toBe(500.0);
    });

    it('permite filtrar clientes por busca de texto (nome ou telefone)', async () => {
      prisma.order.findMany.mockResolvedValue(mockOrders);

      const result = await service.findAll('tenant-1', { search: 'João' });

      expect(result.total).toBe(1);
      expect(result.data[0].name).toBe('João Santos');

      const resultPhone = await service.findAll('tenant-1', { search: '98888' });
      expect(resultPhone.total).toBe(1);
      expect(resultPhone.data[0].name).toBe('Maria Silva');
    });

    it('ordena por totalSpent decrescente por padrão', async () => {
      prisma.order.findMany.mockResolvedValue(mockOrders);

      const result = await service.findAll('tenant-1', {
        sortBy: 'totalSpent',
        sortOrder: 'desc',
      });

      // João gastou 500, Maria gastou 400
      expect(result.data[0].name).toBe('João Santos');
      expect(result.data[1].name).toBe('Maria Silva');
    });
  });

  describe('findOne', () => {
    it('retorna os detalhes de um cliente existente pelo telefone limpo', async () => {
      prisma.order.findMany.mockResolvedValue(mockOrders);

      const customer = await service.findOne('tenant-1', '11988887777');

      expect(customer.name).toBe('Maria Silva');
      expect(customer.cleanPhone).toBe('11988887777');
      expect(customer.totalOrders).toBe(2);
      expect(customer.orders.length).toBe(2);
    });

    it('lança NotFoundException se o cliente não for encontrado para o tenant', async () => {
      prisma.order.findMany.mockResolvedValue(mockOrders);

      await expect(service.findOne('tenant-1', '00000000000')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
