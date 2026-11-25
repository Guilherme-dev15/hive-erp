import { ExecutionContext, HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionStatus } from '@prisma/client';
import { SubscriptionGuard } from './subscription.guard';

describe('SubscriptionGuard', () => {
  const createContext = (req: Record<string, any>): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => req,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as unknown as ExecutionContext;

  let reflector: { getAllAndOverride: jest.Mock };
  let subscriptionService: { getAccessStatus: jest.Mock };
  let guard: SubscriptionGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    subscriptionService = { getAccessStatus: jest.fn() };
    guard = new SubscriptionGuard(
      reflector as unknown as Reflector,
      subscriptionService as any,
    );
  });

  it('permite requisições OPTIONS imediatamente', async () => {
    await expect(guard.canActivate(createContext({ method: 'OPTIONS' }))).resolves.toBe(true);
    expect(subscriptionService.getAccessStatus).not.toHaveBeenCalled();
  });

  it('permite rotas marcadas com @SkipSubscriptionCheck()', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    await expect(guard.canActivate(createContext({ method: 'GET', user: { id: null } }))).resolves.toBe(true);
    expect(subscriptionService.getAccessStatus).not.toHaveBeenCalled();
  });

  it('rejeita com 401 se usuário não foi provisionado (id: null)', async () => {
    await expect(
      guard.canActivate(createContext({ method: 'GET', user: { id: null, legacyId: 'uid-x' } })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('permite super-admin sem consultar bloqueio', async () => {
    await expect(
      guard.canActivate(
        createContext({
          method: 'GET',
          user: { id: 'admin-1', isSuperAdmin: true },
        }),
      ),
    ).resolves.toBe(true);
    expect(subscriptionService.getAccessStatus).not.toHaveBeenCalled();
  });

  it('permite tenant com TRIAL/ACTIVE válido', async () => {
    subscriptionService.getAccessStatus.mockResolvedValue({
      effectiveStatus: SubscriptionStatus.TRIAL,
      isBlocked: false,
      daysRemaining: 10,
    });

    await expect(
      guard.canActivate(
        createContext({
          method: 'GET',
          user: { id: 'tenant-1', isSuperAdmin: false },
        }),
      ),
    ).resolves.toBe(true);
  });

  it('rejeita com HTTP 402 SUBSCRIPTION_EXPIRED quando assinatura está bloqueada', async () => {
    const blockedSummary = {
      status: SubscriptionStatus.TRIAL,
      effectiveStatus: SubscriptionStatus.EXPIRED,
      isBlocked: true,
      isExempt: false,
      daysRemaining: 0,
    };
    subscriptionService.getAccessStatus.mockResolvedValue(blockedSummary);

    let capturedError: unknown;
    try {
      await guard.canActivate(
        createContext({
          method: 'GET',
          user: { id: 'tenant-expired', isSuperAdmin: false },
        }),
      );
    } catch (err) {
      capturedError = err;
    }

    expect(capturedError).toBeInstanceOf(HttpException);
    const httpErr = capturedError as HttpException;
    expect(httpErr.getStatus()).toBe(HttpStatus.PAYMENT_REQUIRED);
    expect(httpErr.getResponse()).toEqual(
      expect.objectContaining({
        statusCode: 402,
        code: 'SUBSCRIPTION_EXPIRED',
        subscription: blockedSummary,
      }),
    );
  });
});
