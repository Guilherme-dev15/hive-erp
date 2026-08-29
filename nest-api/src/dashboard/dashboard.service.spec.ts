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
    
    // Mock the aggregation calls
    (prisma.order.aggregate as jest.Mock).mockResolvedValueOnce({
      _count: { id: 10 },
      _sum: { total: 1000 },
    });
    
    (prisma.order.aggregate as jest.Mock).mockResolvedValueOnce({
      _count: { id: 2 },
    });

    const result = await service.getStats(userId);

    expect(prisma.order.aggregate).toHaveBeenCalledTimes(2);
    expect(result.stats.totalVendas).toBe(1000);
    expect(result.totalOrders).toBe(10);
    expect(result.ordersToday).toBe(2);
    expect(result.averageTicket).toBe(100);
  });
});
