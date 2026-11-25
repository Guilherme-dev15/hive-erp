import { describe, it, expect, vi } from 'vitest';

vi.mock('./firebase/firebaseConfig', () => ({
  auth: { currentUser: null },
  storage: {},
}));

import { formatApiErrorMessage } from './apiService';

describe('formatApiErrorMessage', () => {
  it('formata erro de rede sem conexão (ERR_NETWORK)', () => {
    const error = { code: 'ERR_NETWORK', message: 'Network Error' };
    const msg = formatApiErrorMessage(error);
    expect(msg).toMatch(/Sem conexão com a internet/i);
  });

  it('extrai mensagem simples do servidor', () => {
    const error = {
      response: {
        status: 400,
        data: { message: 'Código de barras já cadastrado em outro produto.' },
      },
    };
    const msg = formatApiErrorMessage(error);
    expect(msg).toBe('Código de barras já cadastrado em outro produto.');
  });

  it('formata array de validação do class-validator', () => {
    const error = {
      response: {
        status: 400,
        data: {
          message: [
            'O nome do produto é obrigatório',
            'O preço de venda deve ser maior que zero',
          ],
        },
      },
    };
    const msg = formatApiErrorMessage(error);
    expect(msg).toBe('O nome do produto é obrigatório • O preço de venda deve ser maior que zero');
  });

  it('retorna mensagem amigável para 401', () => {
    const error = {
      response: {
        status: 401,
        data: {},
      },
    };
    const msg = formatApiErrorMessage(error);
    expect(msg).toMatch(/sessão expirou/i);
  });

  it('retorna mensagem amigável para 500 caso o backend não mande data.message', () => {
    const error = {
      response: {
        status: 500,
        data: {},
      },
    };
    const msg = formatApiErrorMessage(error);
    expect(msg).toMatch(/Servidor temporariamente indisponível/i);
  });
});
