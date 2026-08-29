import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: {
            order: {
              aggregate: jest.fn(),
              findMany: jest.fn(),
            },
            product: {
              count: jest.fn(),
              findMany: jest.fn(),
            },
            transaction: {
              groupBy: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate stats correctly', async () => {
    const userId = 'tenant-123';
    
    // Mock order.aggregate
    (prisma.order.aggregate as jest.Mock).mockResolvedValueOnce({
      _count: { id: 10 },
      _sum: { total: 1000 },
    });
    
    (prisma.order.aggregate as jest.Mock).mockResolvedValueOnce({
      _count: { id: 2 },
    });

    // Mock product.count
    (prisma.product.count as jest.Mock).mockResolvedValue(50);

    // Mock transaction.groupBy
    (prisma.transaction.groupBy as jest.Mock).mockResolvedValue([
      { type: 'DESPESA', _sum: { amount: 200 } },
      { type: 'CAPITAL', _sum: { amount: 500 } },
    ]);

    const result = await service.getStats(userId);

    expect(prisma.order.aggregate).toHaveBeenCalledTimes(2);
    expect(result.stats.totalVendas).toBe(1000);
    expect(result.stats.lucroLiquido).toBe(800);
    expect(result.stats.saldoTotal).toBe(1300);
    expect(result.stats.totalDespesas).toBe(200);
    expect(result.stats.activeProducts).toBe(50);
  });

  it('should calculate ABC report correctly', async () => {
    const userId = 'tenant-123';
    
    // Mock product.findMany for ABC report
    (prisma.product.findMany as jest.Mock).mockResolvedValue([
      { id: '1', name: 'Product 1', quantity: 10, salePrice: 100 }, // Valor: 1000 (Classe A)
      { id: '2', name: 'Product 2', quantity: 5, salePrice: 40 },   // Valor: 200  (Classe B)
      { id: '3', name: 'Product 3', quantity: 10, salePrice: 5 },   // Valor: 50   (Classe C)
    ]);

    const result = await service.getABCReport(userId);

    expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
    expect(result.summary.totalRevenue).toBe(1250);
    expect(result.curvaABC.length).toBe(3);
    
    expect(result.curvaABC[0].id).toBe('1');
    expect(result.curvaABC[0].classificacao).toBe('A');
    
    expect(result.curvaABC[1].id).toBe('2');
    expect(result.curvaABC[1].classificacao).toBe('C'); // 1200 / 1250 = 96% -> Classe C
  });
});
