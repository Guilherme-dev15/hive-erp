import { ExecutionContext, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { BillingWebhookGuard, timingSafeCompare } from './billing-webhook.guard';

describe('BillingWebhookGuard (Segurança Criptográfica & Anti-Fraude)', () => {
  let guard: BillingWebhookGuard;
  const SECRET = 'test-secret-key-32chars-for-hmac';

  beforeEach(() => {
    process.env.BILLING_WEBHOOK_SECRET = SECRET;
    process.env.NODE_ENV = 'test';
    guard = new BillingWebhookGuard();
  });

  afterEach(() => {
    delete process.env.BILLING_WEBHOOK_SECRET;
  });

  const createMockContext = (headers: Record<string, string>, body: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
          body,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  describe('timingSafeCompare', () => {
    it('compara strings idênticas com sucesso', () => {
      expect(timingSafeCompare('abcdef', 'abcdef')).toBe(true);
    });

    it('rejeita strings com comprimentos diferentes com segurança', () => {
      expect(timingSafeCompare('abcdef', 'abcde')).toBe(false);
    });

    it('rejeita strings com conteúdo diferente do mesmo tamanho', () => {
      expect(timingSafeCompare('abcdef', 'abcdeg')).toBe(false);
    });
  });

  describe('Validação via HMAC-SHA256', () => {
    it('permite requisição quando o HMAC no header x-webhook-signature for válido', () => {
      const payload = { event: 'PAYMENT_RECEIVED', id: 'evt-100', payment: { value: 97 } };
      const rawBody = JSON.stringify(payload);
      const signature = createHmac('sha256', SECRET).update(rawBody).digest('hex');

      const context = createMockContext({ 'x-webhook-signature': signature }, payload);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('permite requisição com prefixo sha256= no header x-hub-signature-256', () => {
      const payload = { event: 'PAYMENT_CONFIRMED', id: 'evt-101' };
      const rawBody = JSON.stringify(payload);
      const signature = createHmac('sha256', SECRET).update(rawBody).digest('hex');

      const context = createMockContext({ 'x-hub-signature-256': `sha256=${signature}` }, payload);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('rejeita requisição quando a assinatura HMAC for adulterada (ataque hacker)', () => {
      const payload = { event: 'PAYMENT_RECEIVED', id: 'evt-hack' };
      const fakeSignature = '0000000000000000000000000000000000000000000000000000000000000000';

      const context = createMockContext({ 'x-webhook-signature': fakeSignature }, payload);
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });
  });

  describe('Validação via Token Fixo (Asaas Access Token)', () => {
    it('permite quando o asaas-access-token for idêntico ao segredo', () => {
      const context = createMockContext({ 'asaas-access-token': SECRET }, { event: 'PAYMENT_RECEIVED' });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('rejeita quando o asaas-access-token for incorreto', () => {
      const context = createMockContext({ 'asaas-access-token': 'wrong-token' }, {});
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });
  });

  describe('Bloqueio por Ausência de Headers e Falha Fechada', () => {
    it('rejeita com 401 quando nenhum cabeçalho de autenticação é fornecido', () => {
      const context = createMockContext({}, { test: true });
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('lança 500 em produção se o BILLING_WEBHOOK_SECRET não estiver configurado', () => {
      delete process.env.BILLING_WEBHOOK_SECRET;
      process.env.NODE_ENV = 'production';

      const context = createMockContext({ 'x-webhook-signature': 'sig' }, {});
      expect(() => guard.canActivate(context)).toThrow(InternalServerErrorException);
    });
  });
});
