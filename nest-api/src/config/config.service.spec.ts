import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ConfigService', () => {
  let service: ConfigService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        {
          provide: PrismaService,
          useValue: {
            config: {
              findUnique: jest.fn(),
              upsert: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get config for user', async () => {
    const userId = 'tenant-123';
    const mockConfig = { storeName: 'Test Store', publicSlug: 'test-store' };

    (prisma.config.findUnique as jest.Mock).mockResolvedValue(mockConfig);

    const result = await service.getConfig(userId);
    expect(result).toEqual({ ...mockConfig, slug: 'test-store' });
    expect(prisma.config.findUnique).toHaveBeenCalledWith({ where: { userId } });
  });

  it('should return empty object if no config exists', async () => {
    const userId = 'tenant-123';

    (prisma.config.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await service.getConfig(userId);
    expect(result).toEqual({});
  });

  it('should upsert config for user and map the public slug', async () => {
    const userId = 'tenant-123';
    const dto = { storeName: 'New Store', slug: 'new-store' };

    (prisma.config.upsert as jest.Mock).mockResolvedValue({
      storeName: 'New Store',
      publicSlug: 'new-store',
      userId,
    });

    const result = await service.saveConfig(userId, dto);

    expect(prisma.config.upsert).toHaveBeenCalledWith({
      where: { userId },
      update: { storeName: 'New Store', publicSlug: 'new-store' },
      create: { storeName: 'New Store', publicSlug: 'new-store', userId },
    });
    expect(result).toEqual({
      storeName: 'New Store',
      publicSlug: 'new-store',
      userId,
      slug: 'new-store',
    });
  });
});
