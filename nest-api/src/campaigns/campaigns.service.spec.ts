import { Test, TestingModule } from '@nestjs/testing';
import { CampaignsService } from './campaigns.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProductStatus } from '@prisma/client';

describe('CampaignsService', () => {
  let service: CampaignsService;
  let prisma: {
    product: {
      findMany: jest.Mock;
      update: jest.Mock;
    };
    productVariant: {
      findMany: jest.Mock;
      upsert: jest.Mock;
      deleteMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const mockProducts = [
    {
      id: 'prod-1',
      userId: 'user-1',
      name: 'Colar Prata',
      costPrice: 50,
      salePrice: 100, // Markup: 2.0
      quantity: 10,
      status: ProductStatus.ATIVO,
    },
    {
      id: 'prod-2',
      userId: 'user-1',
      name: 'Anel Prata',
      costPrice: 80,
      salePrice: 100, // Markup: 1.25. If 20% discount -> 80. With minMarkup 1.1 (88), minSafePrice is 88.
      quantity: 5,
      status: ProductStatus.ATIVO,
    },
    {
      id: 'prod-3',
      userId: 'user-1',
      name: 'Brinco Prata Sem Custo',
      costPrice: 0,
      salePrice: 40,
      quantity: 2,
      status: ProductStatus.ATIVO,
    },
  ];

  beforeEach(async () => {
    prisma = {
      product: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      productVariant: {
        findMany: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation((cb) => (typeof cb === 'function' ? cb(prisma) : Promise.all(cb))),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CampaignsService>(CampaignsService);
  });

  describe('simulate', () => {
    it('calcula métricas de simulação com precisão respeitando o markup mínimo', async () => {
      prisma.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.simulate('user-1', {
        discount: 20, // 20% OFF
        minMarkup: 1.1, // Custo * 1.1
      });

      expect(result.totalProducts).toBe(3);
      // prod-1: 100 * 0.8 = 80. minSafe = 50 * 1.1 = 55. 80 >= 55 -> affected
      // prod-2: 100 * 0.8 = 80. minSafe = 80 * 1.1 = 88. 80 < 88 -> clamped to 88 -> skipped
      // prod-3: cost=0 -> 40 * 0.8 = 32 -> affected
      expect(result.affectedProducts).toBe(2);
      expect(result.skippedProducts).toBe(1);

      // currentRevenue: (100*10) + (100*5) + (40*2) = 1000 + 500 + 80 = 1580
      expect(result.currentRevenue).toBe(1580);

      // projectedRevenue: (80*10) + (88*5) + (32*2) = 800 + 440 + 64 = 1304
      expect(result.projectedRevenue).toBe(1304);

      // currentProfit: ((100-50)*10) + ((100-80)*5) + ((40-0)*2) = 500 + 100 + 80 = 680
      expect(result.currentProfit).toBe(680);

      // projectedProfit: ((80-50)*10) + ((88-80)*5) + ((32-0)*2) = 300 + 40 + 64 = 404
      expect(result.projectedProfit).toBe(404);

      expect(result.currentAvgMarkup).toBeGreaterThan(0);
      expect(result.projectedAvgMarkup).toBeGreaterThan(0);
    });

    it('retorna zeros caso a loja não tenha produtos ativos', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      const result = await service.simulate('user-1', {
        discount: 10,
        minMarkup: 1.2,
      });

      expect(result).toEqual({
        totalProducts: 0,
        affectedProducts: 0,
        skippedProducts: 0,
        currentRevenue: 0,
        projectedRevenue: 0,
        currentProfit: 0,
        projectedProfit: 0,
        currentAvgMarkup: 0,
        projectedAvgMarkup: 0,
        totalCost: 0,
      });
    });
  });

  describe('apply', () => {
    it('cria backup dos preços originais em ProductVariant e atualiza salePrice com desconto', async () => {
      prisma.product.findMany.mockResolvedValue(mockProducts);
      prisma.productVariant.findMany.mockResolvedValue([]);
      prisma.productVariant.create.mockResolvedValue({});
      prisma.product.update.mockResolvedValue({});

      const res = await service.apply('user-1', {
        discount: 20,
        minMarkup: 1.1,
        campaignName: 'Black Friday',
      });

      expect(res.success).toBe(true);
      expect(res.count).toBe(3);

      // prod-1: 100 -> 80
      expect(prisma.productVariant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          productId: 'prod-1',
          skuSuffix: '__CAMPAIGN_BACKUP__',
          adjustmentValue: 100,
          measurement: 'Black Friday',
        }),
      });
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { salePrice: 80 },
      });

      // prod-2: 100 -> clamped to 88
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-2' },
        data: { salePrice: 88 },
      });
    });
  });

  describe('revert', () => {
    it('restaura os preços originais a partir de ProductVariant e remove os backups', async () => {
      const mockBackups = [
        {
          id: 'var-1',
          productId: 'prod-1',
          skuSuffix: '__CAMPAIGN_BACKUP__',
          adjustmentValue: 100,
        },
        {
          id: 'var-2',
          productId: 'prod-2',
          skuSuffix: '__CAMPAIGN_BACKUP__',
          adjustmentValue: 100,
        },
      ];

      prisma.productVariant.findMany.mockResolvedValue(mockBackups);
      prisma.product.update.mockResolvedValue({});
      prisma.productVariant.deleteMany.mockResolvedValue({ count: 2 });

      const res = await service.revert('user-1');

      expect(res.success).toBe(true);
      expect(res.message).toContain('2 produtos');
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { salePrice: 100 },
      });
      expect(prisma.productVariant.deleteMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['var-1', 'var-2'] },
        },
      });
    });

    it('retorna mensagem informativa se não houver campanha ativa para reverter', async () => {
      prisma.productVariant.findMany.mockResolvedValue([]);

      const res = await service.revert('user-1');

      expect(res.success).toBe(true);
      expect(res.message).toBe('Nenhuma campanha ativa para reverter.');
      expect(prisma.product.update).not.toHaveBeenCalled();
    });
  });
});
