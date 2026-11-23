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
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockExecutionContext = (headers: Record<string, string>, reqObject: any = {}): ExecutionContext => {
    const requestObj = {
      headers,
      ...reqObject,
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

  it('should match user by legacyId (Firebase UID) first and populate non-admin user context', async () => {
    const context = mockExecutionContext({ authorization: 'Bearer valid-token' });
    const decodedToken = { uid: 'uid123', email: 'test@example.com' };
    (getAuth().verifyIdToken as jest.Mock).mockResolvedValue(decodedToken);

    const mockUser = {
      id: 'pg-uuid-1',
      legacyId: 'uid123',
      email: 'test@example.com',
      role: 'OWNER',
      active: true,
      config: { id: 'cfg-1' },
    };
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
    expect(mockPrisma.user.update).not.toHaveBeenCalled();

    const request = context.switchToHttp().getRequest();
    expect(request.user).toEqual({
      id: 'pg-uuid-1',
      legacyId: 'uid123',
      email: 'test@example.com',
      role: 'OWNER',
      isSuperAdmin: false,
    });
  });

  it('should match user by email as fallback and heal legacyId', async () => {
    const context = mockExecutionContext({ authorization: 'Bearer valid-token' });
    const decodedToken = { uid: 'real-firebase-uid', email: 'test@example.com' };
    (getAuth().verifyIdToken as jest.Mock).mockResolvedValue(decodedToken);

    const mockUser = {
      id: 'pg-uuid-1',
      legacyId: 'test@example.com',
      email: 'test@example.com',
      role: 'OWNER',
      active: true,
      config: { id: 'cfg-1' },
    };
    mockPrisma.user.findFirst.mockResolvedValue(mockUser);
    mockPrisma.user.update.mockResolvedValue({ ...mockUser, legacyId: 'real-firebase-uid' });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pg-uuid-1' },
        data: { legacyId: 'real-firebase-uid' },
      }),
    );

    const request = context.switchToHttp().getRequest();
    expect(request.user).toEqual({
      id: 'pg-uuid-1',
      legacyId: 'real-firebase-uid',
      email: 'test@example.com',
      role: 'OWNER',
      isSuperAdmin: false,
    });
  });

  it('should match user by email case-insensitively, heal legacyId and flag isSuperAdmin', async () => {
    const context = mockExecutionContext({ authorization: 'Bearer valid-token' });
    const decodedToken = { uid: 'real-firebase-uid', email: 'GuiBanks1@GMAIL.COM' };
    (getAuth().verifyIdToken as jest.Mock).mockResolvedValue(decodedToken);

    const mockUser = {
      id: 'pg-uuid-admin',
      legacyId: 'old-uid',
      email: 'guibanks1@gmail.com',
      config: { id: 'cfg-1' },
      active: true,
      role: 'OWNER',
    };
    mockPrisma.user.findFirst.mockResolvedValue(mockUser);
    mockPrisma.user.update.mockResolvedValue({ ...mockUser, legacyId: 'real-firebase-uid' });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pg-uuid-admin' },
        data: { legacyId: 'real-firebase-uid' },
      }),
    );

    const request = context.switchToHttp().getRequest();
    expect(request.user).toEqual({
      id: 'pg-uuid-admin',
      legacyId: 'real-firebase-uid',
      email: 'guibanks1@gmail.com',
      role: 'OWNER',
      isSuperAdmin: true,
    });
  });

  it('should reconcile existing admin email ONLY and never match arbitrary tenant OWNER row', async () => {
    const context = mockExecutionContext({ authorization: 'Bearer valid-token' });
    const decodedToken = { uid: 'new-google-uid', email: 'guilherme.macedo1598@gmail.com' };
    (getAuth().verifyIdToken as jest.Mock).mockResolvedValue(decodedToken);

    const existingOwner = {
      id: 'pg-uuid-owner',
      email: 'guibanks1@gmail.com',
      role: 'OWNER',
      active: true,
      config: { id: 'cfg-1' },
    };
    mockPrisma.user.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existingOwner);

    const linkedUser = { ...existingOwner, legacyId: 'new-google-uid', email: 'guilherme.macedo1598@gmail.com' };
    mockPrisma.user.update.mockResolvedValue(linkedUser);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockPrisma.user.findFirst).toHaveBeenNthCalledWith(2, {
      where: {
        email: {
          in: expect.arrayContaining(['guibanks1@gmail.com', 'guilherme.macedo1598@gmail.com']),
          mode: 'insensitive',
        },
      },
      include: { config: true },
    });

    const request = context.switchToHttp().getRequest();
    expect(request.user.isSuperAdmin).toBe(true);
  });

  it('should reject isSuperAdmin privilege when email_verified is false in Firebase token', async () => {
    const context = mockExecutionContext({ authorization: 'Bearer valid-token' });
    const decodedToken = {
      uid: 'unverified-uid',
      email: 'guibanks1@gmail.com',
      email_verified: false,
    };
    (getAuth().verifyIdToken as jest.Mock).mockResolvedValue(decodedToken);
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'pg-uuid-admin',
      legacyId: 'unverified-uid',
      email: 'guibanks1@gmail.com',
      role: 'OWNER',
      active: true,
      config: { id: 'cfg-1' },
    });

    await guard.canActivate(context);
    const request = context.switchToHttp().getRequest();
    expect(request.user.isSuperAdmin).toBe(false);
  });

  it('should auto-provision cold-start admin user with store hive when no admin exists in DB', async () => {
    const context = mockExecutionContext({ authorization: 'Bearer valid-token' });
    const decodedToken = { uid: 'new-admin-uid', email: 'guibanks1@gmail.com' };
    (getAuth().verifyIdToken as jest.Mock).mockResolvedValue(decodedToken);

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
    const request = context.switchToHttp().getRequest();
    expect(request.user).toEqual({
      id: 'pg-uuid-new-admin',
      legacyId: 'new-admin-uid',
      email: 'guibanks1@gmail.com',
      role: 'OWNER',
      isSuperAdmin: true,
    });
  });

  it('should auto-create config if user exists in DB but has no config', async () => {
    const context = mockExecutionContext({ authorization: 'Bearer valid-token' });
    const decodedToken = { uid: 'uid123', email: 'guibanks1@gmail.com' };
    (getAuth().verifyIdToken as jest.Mock).mockResolvedValue(decodedToken);

    const mockUserWithoutConfig = {
      id: 'pg-uuid-1',
      legacyId: 'uid123',
      email: 'guibanks1@gmail.com',
      config: null,
      active: true,
      role: 'OWNER',
    };
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
      }),
    );
  });

  it('should set id: null and preserve token email if non-admin user is not found in Postgres at all', async () => {
    const context = mockExecutionContext({ authorization: 'Bearer valid-token' });
    const decodedToken = { uid: 'uid123', email: 'notfound@example.com' };
    (getAuth().verifyIdToken as jest.Mock).mockResolvedValue(decodedToken);

    mockPrisma.user.findFirst.mockResolvedValue(null);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
    const request = context.switchToHttp().getRequest();
    expect(request.user).toEqual({
      id: null,
      legacyId: 'uid123',
      email: 'notfound@example.com',
      role: null,
      isSuperAdmin: false,
    });
  });

  it('should initialize firebase-admin app when getApps is empty', async () => {
    const context = mockExecutionContext({ authorization: 'Bearer valid-token' });
    const decodedToken = { uid: 'uid123', email: 'test@example.com' };
    (getAuth().verifyIdToken as jest.Mock).mockResolvedValue(decodedToken);
    (getApps as jest.Mock).mockReturnValue([]);
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'pg-uuid-1',
      legacyId: 'uid123',
      email: 'test@example.com',
      role: 'OWNER',
      config: { id: 'cfg-1' },
    });

    await guard.canActivate(context);

    expect(initializeApp).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: expect.any(String),
      }),
    );
  });
});
