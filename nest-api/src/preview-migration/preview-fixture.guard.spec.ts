import { ExecutionContext } from '@nestjs/common';
import { PreviewFixtureGuard } from './preview-fixture.guard';

describe('PreviewFixtureGuard', () => {
  const previous = { ...process.env };
  const guard = new PreviewFixtureGuard();
  const context = (token?: string) => ({
    switchToHttp: () => ({ getRequest: () => ({ headers: { 'x-preview-fixture-token': token } }) }),
  }) as unknown as ExecutionContext;

  afterEach(() => {
    process.env = { ...previous };
  });

  it('rejects outside Preview or when disabled', () => {
    process.env.VERCEL_ENV = 'production';
    process.env.PREVIEW_FIXTURE_ENABLED = 'true';
    process.env.PREVIEW_FIXTURE_EXPIRES_AT = String(Date.now() + 60_000);
    process.env.PREVIEW_FIXTURE_TOKEN = 'test-token';
    expect(() => guard.canActivate(context('test-token'))).toThrow();
  });

  it('rejects missing or incorrect token', () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.PREVIEW_FIXTURE_ENABLED = 'true';
    process.env.PREVIEW_FIXTURE_EXPIRES_AT = String(Date.now() + 60_000);
    process.env.PREVIEW_FIXTURE_TOKEN = 'test-token';
    expect(() => guard.canActivate(context())).toThrow();
    expect(() => guard.canActivate(context('wrong-token'))).toThrow();
  });

  it('accepts a current Preview request with the exact token', () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.PREVIEW_FIXTURE_ENABLED = 'true';
    process.env.PREVIEW_FIXTURE_EXPIRES_AT = String(Date.now() + 60_000);
    process.env.PREVIEW_FIXTURE_TOKEN = 'test-token';
    expect(guard.canActivate(context('test-token'))).toBe(true);
  });
});
