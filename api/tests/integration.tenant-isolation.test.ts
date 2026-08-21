import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import createApp from '../index';
import { getAuth } from 'firebase-admin/auth';

// Mocking Firebase Admin SDK
vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => [true]), // Simula que o app já foi inicializado
}));
vi.mock('firebase-admin/auth');

const mockDb = {
  collection: vi.fn(),
};

const app = createApp(mockDb);

describe('Multi-Tenancy Isolation Tests', () => {
  const userA_UID = 'user-tenant-A';
  const userB_UID = 'user-tenant-B';

  let getMock: any;

  beforeEach(() => {
    vi.clearAllMocks(); // Limpa os mocks antes de cada teste
    getMock = vi.fn();
    const queryMock = {
      where: vi.fn().mockReturnThis(),
      get: getMock,
    };
    mockDb.collection.mockReturnValue(queryMock);
  });

  it('User from Tenant A should NOT see products from Tenant B', async () => {
    // 1. Setup: O banco de dados tem um produto que pertence ao Tenant B
    const productFromTenantB = {
      id: 'product-b',
      name: 'Produto do Inquilino B',
      userId: 'tenant-B-owner-id', // ID do dono do tenant B
    };

    getMock.mockResolvedValue({
      empty: false,
      docs: [
        {
          id: productFromTenantB.id,
          data: () => productFromTenantB,
        },
      ],
    });

    // 2. Mock da Autenticação: Simula que o User A está fazendo a requisição
    (getAuth as any).mockReturnValue({
      verifyIdToken: vi.fn().mockResolvedValue({ uid: userA_UID }),
    });

    // 3. Execução: User A tenta listar todos os produtos
    const response = await request(app)
      .get('/admin/products')
      .set('Authorization', `Bearer token-for-user-A`);

    // 4. Verificação:
    // A API deve retornar 200 (a requisição em si é válida)
    expect(response.status).toBe(200);
    // A API NUNCA deve retornar o produto do Tenant B para o User A
    expect(response.body).not.toContain(
      expect.objectContaining({ id: 'product-b' })
    );
    // A query no banco de dados DEVE ter sido filtrada pelo UID do User A
    expect(mockDb.collection('products').where).toHaveBeenCalledWith(
      'userId',
      '==',
      userA_UID
    );
  });

  it('User from Tenant A can only create products for their own tenant', async () => {
    const newProductData = {
      name: 'Produto do Inquilino A',
      price: 100,
    };
    const addMock = vi.fn().mockResolvedValue({ id: 'new-product-id' });
    const queryMock = {
      add: addMock,
    };
    mockDb.collection.mockReturnValue(queryMock);

    // Mock da Autenticação: User A está logado
    (getAuth as any).mockReturnValue({
      verifyIdToken: vi.fn().mockResolvedValue({ uid: userA_UID }),
    });

    // Execução: User A cria um novo produto
    await request(app)
      .post('/admin/products')
      .set('Authorization', `Bearer token-for-user-A`)
      .send(newProductData);

    // Verificação: O produto salvo no banco DEVE conter o UID do User A
    expect(addMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ...newProductData,
        userId: userA_UID, // Garante que o ID do tenant foi adicionado
      })
    );
  });
});
