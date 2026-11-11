import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { SuperAdminGuard } from './super-admin.guard';

describe('SuperAdminGuard', () => {
  const guard = new SuperAdminGuard();
  const createContext = (req: Record<string, any>): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    }) as unknown as ExecutionContext;

  it('rejeita com UnauthorizedException quando usuário não possui id', () => {
    expect(() =>
      guard.canActivate(createContext({ method: 'GET', user: { id: null } })),
    ).toThrow(UnauthorizedException);
  });

  it('rejeita com ForbiddenException (403) para lojista OWNER comum', () => {
    expect(() =>
      guard.canActivate(
        createContext({
          method: 'GET',
          user: {
            id: 'tenant-1',
            email: 'lojista@pratas.com',
            role: 'OWNER',
            isSuperAdmin: false,
          },
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('rejeita com ForbiddenException (403) se isSuperAdmin estiver marcado sem e-mail da allowlist', () => {
    expect(() =>
      guard.canActivate(
        createContext({
          method: 'GET',
          user: {
            id: 'tenant-forged',
            email: 'invasor@loja.com',
            role: 'OWNER',
            isSuperAdmin: true,
          },
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('permite administrador da plataforma na allowlist com isSuperAdmin true', () => {
    expect(
      guard.canActivate(
        createContext({
          method: 'GET',
          user: {
            id: 'admin-uuid',
            email: 'guibanks1@gmail.com',
            role: 'OWNER',
            isSuperAdmin: true,
          },
        }),
      ),
    ).toBe(true);
  });
});
