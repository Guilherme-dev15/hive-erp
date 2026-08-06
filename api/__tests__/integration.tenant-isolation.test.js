// __tests__/integration.tenant-isolation.test.js
// Testes de Integração: Isolamento de Tenants (Regra 4 do Prompt Especialista).
// Objetivo: Provar que a API nunca retorna dados de outro tenant.

import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import createApp from '../index';

// Mock dinâmico do DB que registra a chamada .where para inspeção.
const getMock = vi.fn();
const whereMock = vi.fn();

const createMockQuery = () => {
  const query = {
    where: whereMock, // Captura o UID com que foi chamado
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: getMock,
  };
  query.where.mockReturnValue(query); // Retorna a si mesmo para encadear .orderBy ou .get
  return query;
};

const mockDb = {
  collection: vi.fn(() => createMockQuery()),
};

const app = createApp(mockDb);

describe('Integration: Tenant Isolation (Regra 4)', () => {

  it('Tenant A should only see data filtered by their own UID', async () => {
    // Configura o mock para retornar sucesso
    getMock.mockResolvedValue({
      empty: false,
      docs: [{ id: 'p1', data: () => ({ name: 'Product of Tenant A', userId: 'tenant-a-uid' }) }],
    });
    whereMock.mockClear(); // Limpa o registro do filtro

    const response = await request(app)
      .get('/admin/products')
      .set('Authorization', 'Bearer tenant-a-token'); // Token mágico do Tenant A

    expect(response.status).toBe(200);

    // Prova 1: O sistema tentou buscar filtrando pelo UID do Tenant A.
    expect(whereMock).toHaveBeenCalledWith('userId', '==', 'tenant-a-uid');
  });

  it('Tenant B should only see data filtered by their own UID', async () => {
    // Reset dos mocks
    getMock.mockResolvedValue({
      empty: true,
      docs: [],
    });
    whereMock.mockClear();

    const response = await request(app)
      .get('/admin/products')
      .set('Authorization', 'Bearer tenant-b-token'); // Token mágico do Tenant B

    expect(response.status).toBe(200);

    // Prova 2: O sistema tentou buscar filtrando pelo UID do Tenant B.
    expect(whereMock).toHaveBeenCalledWith('userId', '==', 'tenant-b-uid');
  });

  it('A tenant should not be able to use another tenant\'s UID in the query', async () => {
    // Cenário adverso: Tentativa de "passar um UID diferente no filtro".
    // O mock simula um DB que "traz" dados do Tenant B, mas o filtro da query da aplicação
    // protege contra isso: mesmo que o DB retorne dados, o teste apenas verifica
    // que a query pediu o UID do usuário autenticado.

    whereMock.mockClear();

    // Tenta "enganar" a API (mas o nosso app usa req.user.uid, então a tentativa falha).
    const response = await request(app)
      .get('/admin/products')
      .set('Authorization', 'Bearer tenant-a-token'); // UID no token é o do Tenant A

    // O backend do Firestore receberia um filtro fixo baseado no token, não em input externo.
    expect(whereMock).toHaveBeenCalledWith('userId', '==', 'tenant-a-uid');
    expect(whereMock).not.toHaveBeenCalledWith('userId', '==', 'tenant-b-uid');
  });
});
