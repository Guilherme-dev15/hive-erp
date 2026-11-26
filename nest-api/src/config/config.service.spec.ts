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

  it('should get config for user without exposing gateway secrets', async () => {
    const userId = 'tenant-123';
    const mockConfig = {
      storeName: 'Test Store',
      publicSlug: 'test-store',
      gatewayAccessToken: 'v1:encrypted',
      gatewayWebhookSecret: null,
    };

    (prisma.config.findUnique as jest.Mock).mockResolvedValue(mockConfig);

    const result = await service.getConfig(userId);
    expect(result).toEqual({
      storeName: 'Test Store',
      publicSlug: 'test-store',
      slug: 'test-store',
      hasGatewayAccessToken: true,
      hasGatewayWebhookSecret: false,
    });
    expect((result as any).gatewayAccessToken).toBeUndefined();
    expect(prisma.config.findUnique).toHaveBeenCalledWith({ where: { userId } });
  });

  it('should return empty object if no config exists', async () => {
    const userId = 'tenant-123';

    (prisma.config.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await service.getConfig(userId);
    expect(result).toEqual({});
  });

  it('should upsert config for user and map the public slug ignoring hasGatewayAddon self-grant', async () => {
    const userId = 'tenant-123';
    const dto = { storeName: 'New Store', slug: 'new-store', hasGatewayAddon: true };

    (prisma.config.upsert as jest.Mock).mockResolvedValue({
      storeName: 'New Store',
      publicSlug: 'new-store',
      userId,
      hasGatewayAddon: false,
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
      hasGatewayAddon: false,
      slug: 'new-store',
      hasGatewayAccessToken: false,
      hasGatewayWebhookSecret: false,
    });
  });

  it('deve rejeitar checkoutMode GATEWAY se o lojista não possui hasGatewayAddon ativo mesmo tentando self-grant no payload', async () => {
    const userId = 'tenant-123';
    (prisma.config.findUnique as jest.Mock).mockResolvedValue({
      userId,
      hasGatewayAddon: false,
    });

    await expect(
      service.saveConfig(userId, { checkoutMode: 'GATEWAY', hasGatewayAddon: true }),
    ).rejects.toThrow('O Módulo de Gateway Integrado precisa ser contratado para ativar este modo de checkout.');
  });

  it('deve permitir checkoutMode GATEWAY e criptografar credenciais quando hasGatewayAddon é true', async () => {
    const userId = 'tenant-123';
    (prisma.config.findUnique as jest.Mock).mockResolvedValue({
      userId,
      hasGatewayAddon: true,
    });
    (prisma.config.upsert as jest.Mock).mockImplementation(async ({ update }) => ({
      userId,
      storeName: 'Minha Loja',
      checkoutMode: 'GATEWAY',
      hasGatewayAddon: true,
      publicSlug: 'minha-loja',
      gatewayAccessToken: update.gatewayAccessToken,
      gatewayWebhookSecret: update.gatewayWebhookSecret,
    }));

    const result = await service.saveConfig(userId, {
      checkoutMode: 'GATEWAY',
      gatewayAccessToken: 'APP_USR-segredo-mp',
      gatewayWebhookSecret: 'whsec-mp',
    });

    const upsertCall = (prisma.config.upsert as jest.Mock).mock.calls[0][0];
    expect(upsertCall.update.gatewayAccessToken).toMatch(/^v1:/);
    expect(upsertCall.update.gatewayAccessToken).not.toContain('APP_USR-segredo-mp');
    expect(upsertCall.update.gatewayWebhookSecret).toMatch(/^v1:/);
    expect(result.checkoutMode).toBe('GATEWAY');
    expect((result as any).hasGatewayAccessToken).toBe(true);
    expect((result as any).hasGatewayWebhookSecret).toBe(true);
    expect((result as any).gatewayAccessToken).toBeUndefined();
    expect((result as any).gatewayWebhookSecret).toBeUndefined();
  });
});
