import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '@prisma/client';
import { CreateTransactionDto } from './dto/create-transaction.dto';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: {
    transaction: {
      findMany: jest.Mock;
      create: jest.Mock;
      deleteMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      transaction: {
        findMany: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('deve listar transações do tenant ordenadas por date desc', async () => {
      const fakeRows = [{ id: 't1', userId: 'u1', date: new Date('2026-01-02') }];
      prisma.transaction.findMany.mockResolvedValue(fakeRows);

      const result = await service.findAll('u1');

      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        orderBy: { date: 'desc' },
      });
      expect(result).toEqual(fakeRows);
    });
  });

  describe('create', () => {
    it('deve persistir transação injetando userId e convertendo date ISO para Date', async () => {
      const dto: CreateTransactionDto = {
        type: TransactionType.VENDA,
        date: new Date('2026-08-27T10:00:00Z'),
        amount: 150.5,
        description: 'Venda teste',
        category: 'varejo',
        legacyId: 'legacy-1',
      };
      const created = { id: 'uuid-t1', userId: 'u1', ...dto };
      prisma.transaction.create.mockResolvedValue(created);

      const result = await service.create(dto, 'u1');

      expect(prisma.transaction.create).toHaveBeenCalledTimes(1);
      const callArg = prisma.transaction.create.mock.calls[0][0];
      expect(callArg.data.userId).toBe('u1');
      expect(callArg.data.type).toBe(TransactionType.VENDA);
      expect(callArg.data.amount).toBe(150.5);
      expect(callArg.data.description).toBe('Venda teste');
      expect(callArg.data.category).toBe('varejo');
      expect(callArg.data.legacyId).toBe('legacy-1');
      expect(callArg.data.date).toBeInstanceOf(Date);
      expect(result).toEqual(created);
    });
  });

  describe('remove', () => {
    it('deve deletar transação respeitando o userId (multitenant)', async () => {
      prisma.transaction.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.remove('t1', 'u1');

      expect(prisma.transaction.deleteMany).toHaveBeenCalledWith({
        where: { id: 't1', userId: 'u1' },
      });
      expect(result).toEqual({ count: 1 });
    });
  });
});
