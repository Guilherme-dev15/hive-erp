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
    const mockConfig = { storeName: 'Test Store' };
    
    (prisma.config.findUnique as jest.Mock).mockResolvedValue(mockConfig);

    const result = await service.getConfig(userId);
    expect(result).toEqual(mockConfig);
    expect(prisma.config.findUnique).toHaveBeenCalledWith({ where: { userId } });
  });

  it('should return empty object if no config exists', async () => {
    const userId = 'tenant-123';
    
    (prisma.config.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await service.getConfig(userId);
    expect(result).toEqual({});
  });

  it('should upsert config for user', async () => {
    const userId = 'tenant-123';
    const dto = { storeName: 'New Store' };
    
    (prisma.config.upsert as jest.Mock).mockResolvedValue({ ...dto, userId });

    const result = await service.saveConfig(userId, dto);
    
    expect(prisma.config.upsert).toHaveBeenCalledWith({
      where: { userId },
      update: dto,
      create: { ...dto, userId, storeName: 'New Store' },
    });
    expect(result.storeName).toBe('New Store');
  });
});
