import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let mockPrisma: any;

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

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return user info with role admin when user role is OWNER', async () => {
    const mockDbUser = {
      id: 'uuid-123',
      name: 'Guilherme Macedo',
      email: 'guibanks1@gmail.com',
      role: 'OWNER',
      active: true,
    };
    mockPrisma.user.findUnique.mockResolvedValue(mockDbUser);

    const result = await controller.getMe({ user: { id: 'uuid-123', legacyId: 'uid-abc' } });

    expect(result).toEqual({
      id: 'uuid-123',
      name: 'Guilherme Macedo',
      email: 'guibanks1@gmail.com',
      role: 'admin',
      active: true,
    });
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'uuid-123' } });
  });

  it('should fallback to findUnique by legacyId when req.user.id is missing', async () => {
    const mockDbUser = {
      id: 'uuid-123',
      name: 'Vendedor Teste',
      email: 'seller@example.com',
      role: 'SELLER',
      active: true,
    };
    mockPrisma.user.findUnique.mockResolvedValue(mockDbUser);

    const result = await controller.getMe({ user: { id: null, legacyId: 'legacy-uid' } });

    expect(result).toEqual({
      id: 'uuid-123',
      name: 'Vendedor Teste',
      email: 'seller@example.com',
      role: 'editor',
      active: true,
    });
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { legacyId: 'legacy-uid' } });
  });

  it('should throw UnauthorizedException when user is not found in database', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(controller.getMe({ user: { id: 'uuid-notfound' } })).rejects.toThrow(
      new UnauthorizedException('Registro do usuário não encontrado no banco de dados da plataforma.')
    );
  });

  it('should throw UnauthorizedException when req.user has no id and no legacyId', async () => {
    await expect(controller.getMe({ user: {} })).rejects.toThrow(
      new UnauthorizedException('Usuário inválido no contexto')
    );
  });

  describe('onboard', () => {
    it('should successfully onboard a new merchant (Tenant B)', async () => {
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
        },
      };
      mockPrisma.user.create.mockResolvedValue(createdUser);

      const result = await controller.onboard(
        { user: { legacyId: 'firebase-uid-b', email: 'maria@pratasbrasil.com' } },
        { storeName: 'Pratas do Brasil', name: 'Maria Silva', slug: 'pratas-brasil' },
      );

      expect(result).toEqual({
        id: 'uuid-tenant-b',
        name: 'Maria Silva',
        email: 'maria@pratasbrasil.com',
        role: 'admin',
        active: true,
        isNew: true,
        store: {
          id: 'cfg-tenant-b',
          storeName: 'Pratas do Brasil',
          slug: 'pratas-brasil',
        },
      });
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'maria@pratasbrasil.com',
            name: 'Maria Silva',
            role: 'OWNER',
            active: true,
            legacyId: 'firebase-uid-b',
            config: {
              create: expect.objectContaining({
                storeName: 'Pratas do Brasil',
                publicSlug: 'pratas-brasil',
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
        config: { id: 'cfg-1', storeName: 'Loja Existente', publicSlug: 'loja-existente' },
      };
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);

      const result = await controller.onboard(
        { user: { id: 'uuid-existing', legacyId: 'uid-existente' } },
        { storeName: 'Loja Existente' },
      );

      expect(result).toEqual({
        id: 'uuid-existing',
        name: 'Lojista Existente',
        email: 'loja@exemplo.com',
        role: 'admin',
        active: true,
        isNew: false,
        store: {
          id: 'cfg-1',
          storeName: 'Loja Existente',
          slug: 'loja-existente',
        },
      });
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
