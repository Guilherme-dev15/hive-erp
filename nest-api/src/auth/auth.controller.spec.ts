import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionService } from '../billing/subscription.service';

describe('AuthController', () => {
  let controller: AuthController;
  let mockPrisma: any;
  let mockSubscriptionService: any;

  const mockTrialAccess = {
    status: 'TRIAL',
    effectiveStatus: 'TRIAL',
    isBlocked: false,
    isExempt: false,
    planCode: 'PRO_MONTHLY',
    monthlyPriceCents: 9700,
    trialStartsAt: new Date('2026-11-11T00:00:00Z'),
    trialEndsAt: new Date('2026-11-25T00:00:00Z'),
    currentPeriodStart: null,
    currentPeriodEnd: null,
    daysRemaining: 14,
  };

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      config: {
        findFirst: jest.fn(),
      },
    };

    mockSubscriptionService = {
      buildTrialDates: jest.fn().mockReturnValue({
        trialStartsAt: mockTrialAccess.trialStartsAt,
        trialEndsAt: mockTrialAccess.trialEndsAt,
      }),
      getOnboardingDefaults: jest.fn().mockReturnValue({
        planCode: 'PRO_MONTHLY',
        monthlyPriceCents: 9700,
        trialDays: 14,
      }),
      getAccessStatus: jest.fn().mockResolvedValue(mockTrialAccess),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SubscriptionService, useValue: mockSubscriptionService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return user info with role admin, store, isSuperAdmin and subscription when user role is OWNER', async () => {
    const mockDbUser = {
      id: 'uuid-123',
      name: 'Guilherme Macedo',
      email: 'guibanks1@gmail.com',
      role: 'OWNER',
      active: true,
      config: {
        id: 'cfg-1',
        storeName: 'Hive Pratas',
        publicSlug: 'hive',
        primaryColor: '#D4AF37',
        secondaryColor: '#343434',
      },
      subscription: {
        status: 'ACTIVE',
        planCode: 'PRO_MONTHLY',
        monthlyPriceCents: 9700,
        trialStartsAt: mockTrialAccess.trialStartsAt,
        trialEndsAt: mockTrialAccess.trialEndsAt,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        isExempt: true,
      },
    };
    mockPrisma.user.findUnique.mockResolvedValue(mockDbUser);

    const result = await controller.getMe({
      user: { id: 'uuid-123', legacyId: 'uid-abc', isSuperAdmin: true },
    });

    expect(result).toEqual(
      expect.objectContaining({
        id: 'uuid-123',
        name: 'Guilherme Macedo',
        email: 'guibanks1@gmail.com',
        role: 'admin',
        active: true,
        isSuperAdmin: true,
        store: expect.objectContaining({
          storeName: 'Hive Pratas',
          slug: 'hive',
        }),
        subscription: expect.objectContaining({
          effectiveStatus: 'ACTIVE',
          isBlocked: false,
          isExempt: true,
        }),
      }),
    );
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'uuid-123' },
      include: { config: true, subscription: true },
    });
  });

  it('should fallback to findUnique by legacyId when req.user.id is missing', async () => {
    const mockDbUser = {
      id: 'uuid-123',
      name: 'Vendedor Teste',
      email: 'seller@example.com',
      role: 'SELLER',
      active: true,
      config: null,
      subscription: null,
    };
    mockPrisma.user.findUnique.mockResolvedValue(mockDbUser);

    const result = await controller.getMe({ user: { id: null, legacyId: 'legacy-uid' } });

    expect(result.role).toBe('editor');
    expect(result.isSuperAdmin).toBe(false);
    expect(result.subscription).toEqual(mockTrialAccess);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { legacyId: 'legacy-uid' },
      include: { config: true, subscription: true },
    });
  });

  it('should still return HTTP 200 payload on getMe when merchant trial is EXPIRED so frontend renders renewal screen', async () => {
    const expiredSub = {
      status: 'TRIAL',
      planCode: 'PRO_MONTHLY',
      monthlyPriceCents: 9700,
      trialStartsAt: new Date('2026-10-01T00:00:00Z'),
      trialEndsAt: new Date('2026-10-15T00:00:00Z'),
      currentPeriodStart: null,
      currentPeriodEnd: null,
      isExempt: false,
    };
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'uuid-expired',
      name: 'Lojista Expirado',
      email: 'lojista@exemplo.com',
      role: 'OWNER',
      active: true,
      config: { id: 'cfg-exp', storeName: 'Loja Expirada', publicSlug: 'expirada', primaryColor: '#D4AF37', secondaryColor: '#343434' },
      subscription: expiredSub,
    });

    const result = await controller.getMe({ user: { id: 'uuid-expired', legacyId: 'uid-exp' } });

    expect(result.subscription.isBlocked).toBe(true);
    expect(result.subscription.effectiveStatus).toBe('EXPIRED');
    expect(result.isSuperAdmin).toBe(false);
  });

  it('should throw UnauthorizedException when user is not found in database', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(controller.getMe({ user: { id: 'uuid-notfound' } })).rejects.toThrow(
      new UnauthorizedException('Registro do usuário não encontrado no banco de dados da plataforma.'),
    );
  });

  it('should throw UnauthorizedException when req.user has no id and no legacyId', async () => {
    await expect(controller.getMe({ user: {} })).rejects.toThrow(
      new UnauthorizedException('Usuário inválido no contexto'),
    );
  });

  describe('onboard', () => {
    it('should successfully onboard a new merchant (Tenant B) with automatic 14-day TRIAL and token email precedence', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.config.findFirst.mockResolvedValue(null);

      const createdUser = {
        id: 'uuid-tenant-b',
        name: 'Maria Silva',
        email: 'maria@pratasbrasil.com',
        role: 'OWNER',
        active: true,
        legacyId: 'firebase-uid-b',
        config: {
          id: 'cfg-tenant-b',
          storeName: 'Pratas do Brasil',
          publicSlug: 'pratas-brasil',
          primaryColor: '#D4AF37',
          secondaryColor: '#343434',
        },
        subscription: {
          status: 'TRIAL',
          planCode: 'PRO_MONTHLY',
          monthlyPriceCents: 9700,
          trialStartsAt: mockTrialAccess.trialStartsAt,
          trialEndsAt: mockTrialAccess.trialEndsAt,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          isExempt: false,
        },
      };
      mockPrisma.user.create.mockResolvedValue(createdUser);

      const result = await controller.onboard(
        { user: { legacyId: 'firebase-uid-b', email: 'maria@pratasbrasil.com' } },
        {
          storeName: 'Pratas do Brasil',
          name: 'Maria Silva',
          email: 'spoof@invasor.com',
          slug: 'pratas-brasil',
        },
      );

      expect(result.isNew).toBe(true);
      expect(result.email).toBe('maria@pratasbrasil.com');
      expect(result.subscription.effectiveStatus).toBe('TRIAL');
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'maria@pratasbrasil.com',
            subscription: {
              create: expect.objectContaining({
                status: 'TRIAL',
                isExempt: false,
              }),
            },
          }),
        }),
      );
    });

    it('should return existing user without re-creating if already onboarded', async () => {
      const existingUser = {
        id: 'uuid-existing',
        name: 'Lojista Existente',
        email: 'loja@exemplo.com',
        role: 'OWNER',
        active: true,
        config: {
          id: 'cfg-1',
          storeName: 'Loja Existente',
          publicSlug: 'loja-existente',
          primaryColor: '#D4AF37',
          secondaryColor: '#343434',
        },
        subscription: {
          status: 'TRIAL',
          planCode: 'PRO_MONTHLY',
          monthlyPriceCents: 9700,
          trialStartsAt: mockTrialAccess.trialStartsAt,
          trialEndsAt: mockTrialAccess.trialEndsAt,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          isExempt: false,
        },
      };
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);

      const result = await controller.onboard(
        { user: { id: 'uuid-existing', legacyId: 'uid-existente' } },
        { storeName: 'Loja Existente' },
      );

      expect(result.isNew).toBe(false);
      expect(result.store?.slug).toBe('loja-existente');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if slug is already in use by another merchant', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.config.findFirst.mockResolvedValue({ id: 'cfg-tenant-a', publicSlug: 'hive' });

      await expect(
        controller.onboard(
          { user: { legacyId: 'uid-b', email: 'b@exemplo.com' } },
          { storeName: 'Outra Loja', slug: 'hive' },
        ),
      ).rejects.toThrow('Slug já está em uso por outro lojista');
    });

    it('should throw BadRequestException if email is missing', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        controller.onboard(
          { user: { legacyId: 'uid-no-email' } },
          { storeName: 'Loja Sem Email' },
        ),
      ).rejects.toThrow('E-mail é obrigatório para cadastrar uma nova loja');
    });
  });
});
