import { AuthGuard } from './auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

jest.mock('firebase-admin/app', () => ({
  getApps: jest.fn().mockReturnValue([]),
  initializeApp: jest.fn(),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn().mockReturnValue({
    verifyIdToken: jest.fn(),
  }),
}));

import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      config: {
        create: jest.fn(),
      },
    };
    guard = new AuthGuard(mockPrisma as PrismaService);

    // Configurar variáveis de ambiente mock para testes locais
    process.env.NODE_ENV = 'production'; // Forçar caminho de auth real
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockExecutionContext = (headers: Record<string, string>, reqObject: any = {}): ExecutionContext => {
    const requestObj = {
      headers,
      ...reqObject
    };
    return {
      switchToHttp: () => ({
        getRequest: () => requestObj,
      }),
    } as unknown as ExecutionContext;
  };

  it('should throw UnauthorizedException if no token is provided in production', async () => {
    const context = mockExecutionContext({});
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if token is invalid', async () => {
    const context = mockExecutionContext({ authorization: 'Bearer invalid-token' });
    (getAuth().verifyIdToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));
    
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should match user by legacyId (Firebase UID) first', async () => {
    const context = mockExecutionContext({ authorization: 'Bearer valid-token' });
    const decodedToken = { uid: 'uid123', email: 'test@example.com' };
    (getAuth().verifyIdToken as jest.Mock).mockResolvedValue(decodedToken);

    const mockUser = { id: 'pg-uuid-1', legacyId: 'uid123', email: 'test@example.com', config: { id: 'cfg-1' } };
    mockPrisma.user.findFirst.mockResolvedValue(mockUser);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { legacyId: 'uid123' },
          { email: { equals: 'test@example.com', mode: 'insensitive' } },
        ],
      },
      include: { config: true },
    });
    // Não deve tentar curar se o legacyId já bate com o firebaseUid
    expect(mockPrisma.user.update).not.toHaveBeenCalled();

    const request = context.switchToHttp().getRequest();
    expect(request.user).toEqual({ id: 'pg-uuid-1', legacyId: 'uid123' });
  });

  it('should match user by email as fallback and heal legacyId', async () => {
    const context = mockExecutionContext({ authorization: 'Bearer valid-token' });
    const decodedToken = { uid: 'real-firebase-uid', email: 'test@example.com' };
    (getAuth().verifyIdToken as jest.Mock).mockResolvedValue(decodedToken);

    // Usuário no BD com legacyId antigo (email, feito na migração seed)
    const mockUser = { id: 'pg-uuid-1', legacyId: 'test@example.com', email: 'test@example.com', config: { id: 'cfg-1' } };
    mockPrisma.user.findFirst.mockResolvedValue(mockUser);
    mockPrisma.user.update.mockResolvedValue({ ...mockUser, legacyId: 'real-firebase-uid' });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pg-uuid-1' },
        data: { legacyId: 'real-firebase-uid' },
      })
    );

    const request = context.switchToHttp().getRequest();
    // Injeta o ID real do postgres e o legacyId curado (o real uid do firebase)
    expect(request.user).toEqual({ id: 'pg-uuid-1', legacyId: 'real-firebase-uid' });
  });

  it('should match user by email case-insensitively and heal legacyId', async () => {
    const context = mockExecutionContext({ authorization: 'Bearer valid-token' });
    const decodedToken = { uid: 'real-firebase-uid', email: 'GuiBanks1@GMAIL.COM' };
    (getAuth().verifyIdToken as jest.Mock).mockResolvedValue(decodedToken);

    const mockUser = { id: 'pg-uuid-admin', legacyId: 'old-uid', email: 'guibanks1@gmail.com', config: { id: 'cfg-1' }, active: true, role: 'OWNER' };
    mockPrisma.user.findFirst.mockResolvedValue(mockUser);
    mockPrisma.user.update.mockResolvedValue({ ...mockUser, legacyId: 'real-firebase-uid' });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { legacyId: 'real-firebase-uid' },
          { email: { equals: 'guibanks1@gmail.com', mode: 'insensitive' } },
        ],
      },
      include: { config: true },
    });
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pg-uuid-admin' },
        data: { legacyId: 'real-firebase-uid' },
      })
    );

    const request = context.switchToHttp().getRequest();
    expect(request.user).toEqual({ id: 'pg-uuid-admin', legacyId: 'real-firebase-uid' });
  });

  it('should auto-link existing owner user to admin if user not found directly but is known admin', async () => {
    const context = mockExecutionContext({ authorization: 'Bearer valid-token' });
    const decodedToken = { uid: 'new-google-uid', email: 'guilherme.macedo1598@gmail.com' };
    (getAuth().verifyIdToken as jest.Mock).mockResolvedValue(decodedToken);

    // Primeira busca: não encontra por legacyId nem por guilherme.macedo1598@gmail.com
    // Segunda busca (procura admin existente): encontra dono com guibanks1@gmail.com
    const existingOwner = { id: 'pg-uuid-owner', email: 'guibanks1@gmail.com', role: 'OWNER', active: true, config: { id: 'cfg-1' } };
    mockPrisma.user.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existingOwner);

    const linkedUser = { ...existingOwner, legacyId: 'new-google-uid', email: 'guilherme.macedo1598@gmail.com' };
    mockPrisma.user.update.mockResolvedValue(linkedUser);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'pg-uuid-owner' },
      data: expect.objectContaining({
        legacyId: 'new-google-uid',
        role: 'OWNER',
        active: true,
      }),
      include: { config: true },
    });

    const request = context.switchToHttp().getRequest();
    expect(request.user).toEqual({ id: 'pg-uuid-owner', legacyId: 'new-google-uid' });
  });

  it('should auto-provision cold-start admin user with store hive when no user exists in DB', async () => {
    const context = mockExecutionContext({ authorization: 'Bearer valid-token' });
    const decodedToken = { uid: 'new-admin-uid', email: 'guibanks1@gmail.com' };
    (getAuth().verifyIdToken as jest.Mock).mockResolvedValue(decodedToken);

    // Ambas as buscas retornam null (banco vazio / cold-start)
    mockPrisma.user.findFirst.mockResolvedValue(null);

    const provisionedUser = {
      id: 'pg-uuid-new-admin',
      email: 'guibanks1@gmail.com',
      name: 'Guilherme Macedo',
      role: 'OWNER',
      active: true,
      legacyId: 'new-admin-uid',
      config: { id: 'cfg-new', storeName: 'Hive Pratas', publicSlug: 'hive' },
    };
    mockPrisma.user.create.mockResolvedValue(provisionedUser);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'guibanks1@gmail.com',
          role: 'OWNER',
          active: true,
          legacyId: 'new-admin-uid',
          config: {
            create: expect.objectContaining({
              storeName: 'Hive Pratas',
              publicSlug: 'hive',
            }),
          },
        }),
      })
    );

    const request = context.switchToHttp().getRequest();
    expect(request.user).toEqual({ id: 'pg-uuid-new-admin', legacyId: 'new-admin-uid' });
  });

  it('should auto-create config if user exists in DB but has no config', async () => {
    const context = mockExecutionContext({ authorization: 'Bearer valid-token' });
    const decodedToken = { uid: 'uid123', email: 'guibanks1@gmail.com' };
    (getAuth().verifyIdToken as jest.Mock).mockResolvedValue(decodedToken);

    const mockUserWithoutConfig = { id: 'pg-uuid-1', legacyId: 'uid123', email: 'guibanks1@gmail.com', config: null, active: true, role: 'OWNER' };
    mockPrisma.user.findFirst.mockResolvedValue(mockUserWithoutConfig);
    mockPrisma.config.create.mockResolvedValue({ id: 'cfg-new', userId: 'pg-uuid-1', storeName: 'Hive Pratas' });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockPrisma.config.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'pg-uuid-1',
          storeName: 'Hive Pratas',
        }),
      })
    );

    const request = context.switchToHttp().getRequest();
    expect(request.user).toEqual({ id: 'pg-uuid-1', legacyId: 'uid123' });
  });

  it('should set id: null if non-admin user is not found in Postgres at all', async () => {
    const context = mockExecutionContext({ authorization: 'Bearer valid-token' });
    const decodedToken = { uid: 'uid123', email: 'notfound@example.com' };
    (getAuth().verifyIdToken as jest.Mock).mockResolvedValue(decodedToken);

    mockPrisma.user.findFirst.mockResolvedValue(null);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
    const request = context.switchToHttp().getRequest();
    // Isola e permite falhar graciosamente depois na stack se necessário, ou mock user
    expect(request.user).toEqual({ id: null, legacyId: 'uid123' });
  });

  it('should initialize firebase-admin app when getApps is empty', async () => {
    const context = mockExecutionContext({ authorization: 'Bearer valid-token' });
    const decodedToken = { uid: 'uid123', email: 'test@example.com' };
    (getAuth().verifyIdToken as jest.Mock).mockResolvedValue(decodedToken);
    (getApps as jest.Mock).mockReturnValue([]);
    mockPrisma.user.findFirst.mockResolvedValue({ id: 'pg-uuid-1', legacyId: 'uid123', email: 'test@example.com' });

    await guard.canActivate(context);

    expect(initializeApp).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: expect.any(String),
      })
    );
  });
});
