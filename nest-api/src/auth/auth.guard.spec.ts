import { AuthGuard } from './auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
    };
    guard = new AuthGuard(mockPrisma as PrismaService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  // TODO: Adicionar os testes de isolamento completos mockando firebase-admin e execution context.
});
