import { IncomingMessage, ServerResponse } from 'node:http';
import { createCorsPreflightHandler, isOriginAllowed } from './serverless-cors';

describe('serverless CORS logic', () => {
  describe('isOriginAllowed', () => {
    const allowedPatterns = [
      'https://hive-erp.vercel.app',
      'https://hiveerp-catalogo.vercel.app',
      'https://*.meudominio.com.br',
      'https://*.vercel.app',
      'http://localhost:5173',
    ];

    it('deve permitir chamadas sem origin (server-to-server, curl, ferramentas locais)', () => {
      expect(isOriginAllowed(undefined, allowedPatterns)).toBe(true);
      expect(isOriginAllowed('', allowedPatterns)).toBe(true);
    });

    it('deve permitir origens exatas listadas', () => {
      expect(isOriginAllowed('https://hive-erp.vercel.app', allowedPatterns)).toBe(true);
      expect(isOriginAllowed('https://hiveerp-catalogo.vercel.app', allowedPatterns)).toBe(true);
      expect(isOriginAllowed('http://localhost:5173', allowedPatterns)).toBe(true);
    });

    it('deve permitir subdomínios wildcard correspondentes (ex: https://*.meudominio.com.br)', () => {
      expect(isOriginAllowed('https://pratas.meudominio.com.br', allowedPatterns)).toBe(true);
      expect(isOriginAllowed('https://loja-vip.meudominio.com.br', allowedPatterns)).toBe(true);
      expect(isOriginAllowed('https://store123.meudominio.com.br', allowedPatterns)).toBe(true);
    });

    it('deve ser insensível a maiúsculas/minúsculas no origin', () => {
      expect(isOriginAllowed('https://Pratas.MeuDominio.com.br', allowedPatterns)).toBe(true);
      expect(isOriginAllowed('HTTPS://HIVE-ERP.VERCEL.APP', allowedPatterns)).toBe(true);
    });

    it('deve permitir previews wildcard da Vercel (ex: https://*.vercel.app)', () => {
      expect(isOriginAllowed('https://hiveerp-catalogo-preview-abc.vercel.app', allowedPatterns)).toBe(true);
    });

    it('NÃO deve permitir domínios maliciosos com nomes parecidos', () => {
      // Sem o ponto separador do subdomínio
      expect(isOriginAllowed('https://evil-meudominio.com.br', allowedPatterns)).toBe(false);
      expect(isOriginAllowed('https://meudominio.com.br.evil.com', allowedPatterns)).toBe(false);
      expect(isOriginAllowed('https://not-allowed.example', allowedPatterns)).toBe(false);
    });
  });

  describe('createCorsPreflightHandler com Wildcards', () => {
    it('deve responder 204 para preflight de subdomínio wildcard', () => {
      const headers: Record<string, string> = {};
      const end = jest.fn();
      const response = {
        setHeader: jest.fn((name: string, value: string) => {
          headers[name.toLowerCase()] = value;
        }),
        statusCode: 200,
        end,
      } as unknown as ServerResponse;

      const request = {
        method: 'OPTIONS',
        headers: {
          origin: 'https://minhaloja.meudominio.com.br',
          'access-control-request-method': 'GET',
        },
      } as unknown as IncomingMessage;

      const handler = createCorsPreflightHandler([
        'https://*.meudominio.com.br',
      ]);

      const handled = handler(request, response);

      expect(handled).toBe(true);
      expect(response.statusCode).toBe(204);
      expect(headers['access-control-allow-origin']).toBe('https://minhaloja.meudominio.com.br');
      expect(headers['access-control-allow-credentials']).toBe('true');
      expect(headers['access-control-allow-methods']).toContain('GET');
      expect(end).toHaveBeenCalledTimes(1);
    });

    it('NÃO deve atender preflight de origin não aprovada', () => {
      const response = {
        setHeader: jest.fn(),
        statusCode: 200,
        end: jest.fn(),
      } as unknown as ServerResponse;

      const request = {
        method: 'OPTIONS',
        headers: {
          origin: 'https://hacker.com',
          'access-control-request-method': 'GET',
        },
      } as unknown as IncomingMessage;

      const handler = createCorsPreflightHandler([
        'https://*.meudominio.com.br',
      ]);

      const handled = handler(request, response);

      expect(handled).toBe(false);
      expect(response.setHeader).not.toHaveBeenCalled();
      expect(response.end).not.toHaveBeenCalled();
    });
  });
});
