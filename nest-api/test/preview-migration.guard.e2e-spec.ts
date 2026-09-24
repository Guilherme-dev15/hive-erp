import { ExecutionContext } from '@nestjs/common';
import { createHash, createHmac } from 'node:crypto';
import { PreviewMigrationGuard } from '../src/preview-migration/preview-migration.guard';

describe('PreviewMigrationGuard', () => {
  const previous = { ...process.env };
  const guard = new PreviewMigrationGuard({ $executeRawUnsafe: jest.fn(), $executeRaw: jest.fn() } as never);

  afterEach(() => {
    process.env = { ...previous };
  });

  it('rejects requests outside Preview or without the feature flag', async () => {
    process.env.VERCEL_ENV = 'production';
    process.env.PREVIEW_MIGRATION_ENABLED = 'true';
    await expect(guard.canActivate({ switchToHttp: () => ({ getRequest: () => ({ headers: {} }) }) } as ExecutionContext)).rejects.toThrow();
  });

  it('accepts a current signed request in Preview', async () => {
    const now = Date.now();
    const body = JSON.stringify({ operationId: 'op-12345678', batchId: 'categories' });
    const secret = 'test-secret';
    const nonce = 'nonce-1';
    process.env.VERCEL_ENV = 'preview';
    process.env.PREVIEW_MIGRATION_ENABLED = 'true';
    process.env.PREVIEW_MIGRATION_SECRET = secret;
    process.env.PREVIEW_MIGRATION_EXPIRES_AT = String(now + 60_000);
    const bodyHash = createHash('sha256').update(body).digest('hex');
    (guard as any).prisma.$executeRawUnsafe.mockResolvedValue(0);
    (guard as any).prisma.$executeRaw.mockResolvedValue(1);
    const signature = createHmac('sha256', secret).update(`${now}.${nonce}.${bodyHash}`).digest('hex');
    const request = {
      body: JSON.parse(body),
      rawBody: Buffer.from(body),
      header: (name: string) => ({
        'x-preview-migration-timestamp': String(now),
        'x-preview-migration-nonce': nonce,
        'x-preview-migration-signature': signature,
      }[name]),
    };
    await expect(guard.canActivate({ switchToHttp: () => ({ getRequest: () => request }) } as ExecutionContext)).resolves.toBe(true);
  });
});
