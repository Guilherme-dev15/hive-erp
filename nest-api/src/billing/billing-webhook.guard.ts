import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';

export function timingSafeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

@Injectable()
export class BillingWebhookGuard implements CanActivate {
  private readonly logger = new Logger(BillingWebhookGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const secret = process.env.BILLING_WEBHOOK_SECRET;

    // Proteção Fail-Closed: Em produção, se o segredo não estiver configurado, bloqueia imediatamente
    if (process.env.NODE_ENV === 'production' && !secret) {
      this.logger.error('CRÍTICO: BILLING_WEBHOOK_SECRET não configurado em ambiente de produção');
      throw new InternalServerErrorException(
        'Configuração de segurança do webhook de faturamento indisponível',
      );
    }

    const effectiveSecret = secret || 'dev-billing-secret-key-32chars';

    // Extração de headers de autenticação suportados
    const hmacHeader =
      (request.headers['x-webhook-signature'] as string) ||
      (request.headers['x-hub-signature-256'] as string) ||
      (request.headers['x-signature'] as string);

    const asaasTokenHeader = request.headers['asaas-access-token'] as string;

    // 1. Verificação via Token Fixo Seguro (Ex: Asaas Access Token)
    if (asaasTokenHeader) {
      if (timingSafeCompare(asaasTokenHeader, effectiveSecret)) {
        return true;
      }
      this.logger.warn('Tentativa de acesso com asaas-access-token inválido');
      throw new UnauthorizedException('Assinatura do webhook inválida');
    }

    // 2. Verificação via HMAC-SHA256 (Ex: Mercado Pago / Webhook Padrão)
    if (hmacHeader) {
      const cleanSignature = hmacHeader.replace(/^sha256=/, '').trim();
      const rawBody =
        typeof request.body === 'string'
          ? request.body
          : JSON.stringify(request.body || {});

      const expectedHmac = createHmac('sha256', effectiveSecret)
        .update(rawBody)
        .digest('hex');

      if (timingSafeCompare(cleanSignature, expectedHmac)) {
        return true;
      }

      this.logger.warn('Tentativa de acesso com assinatura HMAC-SHA256 inválida');
      throw new UnauthorizedException('Assinatura do webhook inválida');
    }

    this.logger.warn('Requisição de webhook recebida sem cabeçalho de assinatura');
    throw new UnauthorizedException('Cabeçalho de autenticação do webhook ausente');
  }
}
