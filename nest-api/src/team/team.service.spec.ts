import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { TeamService } from './team.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TeamService (Contenção Multitenant - Regra 4)', () => {
  let service: TeamService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<TeamService>(TeamService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMembers', () => {
    it('retorna apenas o próprio OWNER autenticado e nunca consulta SELLERs globais', async () => {
      const ownerB = {
        id: 'uuid-tenant-b',
        name: 'Lojista B',
        email: 'owner-b@loja.com',
        role: Role.OWNER,
        active: true,
        legacyId: 'firebase-secret-uid-b',
        createdAt: new Date('2026-11-01T10:00:00Z'),
      };
      mockPrisma.user.findUnique.mockResolvedValue(ownerB);

      const members = await service.getMembers('uuid-tenant-b');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid-tenant-b' },
      });
      expect(mockPrisma.user.findMany).not.toHaveBeenCalled();
      expect(members).toEqual([
        {
          id: 'uuid-tenant-b',
          name: 'Lojista B',
          email: 'owner-b@loja.com',
          role: Role.OWNER,
          active: true,
          createdAt: ownerB.createdAt,
        },
      ]);
      expect(members[0]).not.toHaveProperty('legacyId');
    });

    it('rejeita com ForbiddenException quando usuário não é OWNER', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uuid-seller',
        role: Role.SELLER,
      });

      await expect(service.getMembers('uuid-seller')).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPrisma.user.findMany).not.toHaveBeenCalled();
    });
  });

  describe('inviteMember', () => {
    it('bloqueia convite enquanto não existe vínculo multi-usuário por loja (sem criar usuário órfão)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uuid-tenant-b',
        email: 'owner-b@loja.com',
        role: Role.OWNER,
      });

      await expect(
        service.inviteMember(
          { name: 'Vendedor Terceiro', email: 'seller@outro-tenant.com' },
          'uuid-tenant-b',
        ),
      ).rejects.toThrow(ForbiddenException);

      // Nem consulta e-mail de terceiros (evita enumeração) nem cria usuário órfão
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid-tenant-b' },
      });
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('removeMember', () => {
    it('rejeita com 404 e nunca deleta usuário pertencente a outro tenant', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uuid-tenant-b',
        email: 'owner-b@loja.com',
        role: Role.OWNER,
      });

      await expect(
        service.removeMember('seller-tenant-a@loja.com', 'uuid-tenant-b'),
      ).rejects.toThrow(NotFoundException);

      // Apenas checou o próprio owner; jamais consultou nem apagou o e-mail alvo
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.delete).not.toHaveBeenCalled();
    });

    it('rejeita com NotFoundException sem lançar URIError 500 quando e-mail possui sequência % malformada', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uuid-tenant-b',
        email: 'owner-b@loja.com',
        role: Role.OWNER,
      });

      await expect(
        service.removeMember('invalido%ZZ@loja.com', 'uuid-tenant-b'),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.user.delete).not.toHaveBeenCalled();
    });

    it('rejeita com BadRequestException ao tentar remover o próprio dono da loja', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uuid-tenant-b',
        email: 'owner-b@loja.com',
        role: Role.OWNER,
      });

      await expect(
        service.removeMember('OWNER-B@LOJA.COM', 'uuid-tenant-b'),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.user.delete).not.toHaveBeenCalled();
    });
  });
});
