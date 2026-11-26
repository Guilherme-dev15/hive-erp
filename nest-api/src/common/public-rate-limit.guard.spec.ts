import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PublicRateLimitGuard } from './public-rate-limit.guard';

describe('PublicRateLimitGuard', () => {
  let guard: PublicRateLimitGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  const createContext = (ip = '192.168.1.10', headers: Record<string, string> = {}) => {
    const setHeader = jest.fn();
    const ctx = {
      getHandler: () => function mockHandler() {},
      getClass: () => class MockController {},
      switchToHttp: () => ({
        getRequest: () => ({ ip, headers }),
        getResponse: () => ({ setHeader }),
      }),
    } as unknown as ExecutionContext;
    return { ctx, setHeader };
  };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new PublicRateLimitGuard(reflector as unknown as Reflector);
  });

  it('permite requisições quando não há metadata de rate limit', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const { ctx } = createContext();
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('permite até o limite e bloqueia com 429 + Retry-After ao exceder', () => {
    reflector.getAllAndOverride.mockReturnValue({
      limit: 2,
      windowMs: 60_000,
      keyPrefix: 'public-orders',
    });

    const req1 = createContext('10.0.0.1', { 'x-forwarded-for': '200.10.20.30, 10.0.0.1' });
    expect(guard.canActivate(req1.ctx)).toBe(true);
    expect(guard.canActivate(req1.ctx)).toBe(true);

    try {
      guard.canActivate(req1.ctx);
      fail('Deveria ter lançado HttpException 429');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(req1.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(String));
    }

    // Outro IP continua liberado
    const req2 = createContext('10.0.0.2', { 'x-forwarded-for': '200.10.20.99' });
    expect(guard.canActivate(req2.ctx)).toBe(true);
  });
});
