import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const mockPrismaService = {};
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrismaService }
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Máquina de Estados (Valid Transitions)', () => {
    it('deve permitir transição de AGUARDANDO_PAGAMENTO para EM_PRODUCAO', () => {
      const valid = service['getValidTransitions'](OrderStatus.AGUARDANDO_PAGAMENTO);
      expect(valid).toContain(OrderStatus.EM_PRODUCAO);
    });

    it('NÃO deve permitir transição de CANCELADO para qualquer outro status', () => {
      const valid = service['getValidTransitions'](OrderStatus.CANCELADO);
      expect(valid.length).toBe(0);
    });
  });
});
