import { AuthGuard } from './auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn().mockReturnValue({
    verifyIdToken: jest.fn(),
  }),
}));

import { getAuth } from 'firebase-admin/auth';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findFirst: jest.fn(),
        update: jest.fn(),
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
    
    const mockUser = { id: 'pg-uuid-1', legacyId: 'uid123', email: 'test@example.com' };
    mockPrisma.user.findFirst.mockResolvedValue(mockUser);

    const result = await guard.canActivate(context);
    
    expect(result).toBe(true);
    expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { legacyId: 'uid123' },
          { email: 'test@example.com' },
        ],
      },
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
    const mockUser = { id: 'pg-uuid-1', legacyId: 'test@example.com', email: 'test@example.com' };
    mockPrisma.user.findFirst.mockResolvedValue(mockUser);
    mockPrisma.user.update.mockResolvedValue({ ...mockUser, legacyId: 'real-firebase-uid' });

    const result = await guard.canActivate(context);
    
    expect(result).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'pg-uuid-1' },
      data: { legacyId: 'real-firebase-uid' },
    });
    
    const request = context.switchToHttp().getRequest();
    // Injeta o ID real do postgres e o legacyId curado (o real uid do firebase)
    expect(request.user).toEqual({ id: 'pg-uuid-1', legacyId: 'real-firebase-uid' });
  });

  it('should set id: null if user is not found in Postgres at all', async () => {
    const context = mockExecutionContext({ authorization: 'Bearer valid-token' });
    const decodedToken = { uid: 'uid123', email: 'notfound@example.com' };
    (getAuth().verifyIdToken as jest.Mock).mockResolvedValue(decodedToken);
    
    mockPrisma.user.findFirst.mockResolvedValue(null);

    const result = await guard.canActivate(context);
    
    expect(result).toBe(true);
    const request = context.switchToHttp().getRequest();
    // Isola e permite falhar graciosamente depois na stack se necessário, ou mock user
    expect(request.user).toEqual({ id: null, legacyId: 'uid123' });
  });
});
