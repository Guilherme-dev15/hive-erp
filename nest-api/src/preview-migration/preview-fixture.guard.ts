import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class PreviewFixtureGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const now = Date.now();
    const expiresAt = Number(process.env.PREVIEW_FIXTURE_EXPIRES_AT);
    const configuredToken = process.env.PREVIEW_FIXTURE_TOKEN;
    const requestToken = request.headers['x-preview-fixture-token'];

    if (
      process.env.VERCEL_ENV !== 'preview' ||
      process.env.PREVIEW_FIXTURE_ENABLED !== 'true' ||
      !Number.isFinite(expiresAt) ||
      now >= expiresAt ||
      !configuredToken ||
      !requestToken ||
      requestToken !== configuredToken
    ) {
      throw new UnauthorizedException('Fixture temporária indisponível');
    }

    return true;
  }
}
