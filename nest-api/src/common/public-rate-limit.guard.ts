import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const RATE_LIMIT_KEY = 'public_rate_limit_options';

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  keyPrefix?: string;
}

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

interface RateBucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class PublicRateLimitGuard implements CanActivate {
  private readonly store = new Map<string, RateBucket>();

  constructor(private readonly reflector: Reflector) {}

  resetStore(): void {
    this.store.clear();
  }

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector?.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!options) {
      return true;
    }

    const http = context.switchToHttp();
    const request = http.getRequest<any>();
    const response = http.getResponse<any>();

    const ip = this.extractClientIp(request);
    const prefix = options.keyPrefix || context.getHandler()?.name || 'public';
    const key = `${prefix}:${ip}`;
    const now = Date.now();

    if (this.store.size > 1000) {
      this.cleanupExpired(now);
    }

    const existing = this.store.get(key);
    if (!existing || now >= existing.resetAt) {
      this.store.set(key, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      return true;
    }

    if (existing.count >= options.limit) {
      const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      if (response && typeof response.setHeader === 'function') {
        response.setHeader('Retry-After', String(retryAfterSec));
      }
      throw new HttpException(
        'Muitas requisições. Tente novamente em instantes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    existing.count += 1;
    return true;
  }

  private extractClientIp(request: any): string {
    const forwardedFor = request?.headers?.['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.trim().length > 0) {
      return forwardedFor.split(',')[0].trim();
    }
    if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
      return String(forwardedFor[0]).split(',')[0].trim();
    }
    const realIp = request?.headers?.['x-real-ip'];
    if (typeof realIp === 'string' && realIp.trim().length > 0) {
      return realIp.trim();
    }
    return request?.ip || request?.socket?.remoteAddress || 'unknown';
  }

  private cleanupExpired(now: number): void {
    for (const [key, bucket] of this.store.entries()) {
      if (now >= bucket.resetAt) {
        this.store.delete(key);
      }
    }
  }
}
