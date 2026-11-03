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
});
