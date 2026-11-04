import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let service: {
    findAll: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    const mockPrismaService = {};
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        { provide: TransactionsService, useValue: service },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates update to service', async () => {
    service.update.mockResolvedValue({ id: 't1', amount: 200 });

    const res = await controller.update('t1', { amount: 200 }, { user: { id: 'u1' } });

    expect(service.update).toHaveBeenCalledWith('t1', { amount: 200 }, 'u1');
    expect(res).toEqual({ id: 't1', amount: 200 });
  });
});
