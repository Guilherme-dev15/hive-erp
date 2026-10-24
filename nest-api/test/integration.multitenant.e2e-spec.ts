import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthGuard } from '../src/auth/auth.guard';

/**
 * REGRA 4 - Auditoria Multitenant
 * Prove que usuário do Tenant A não consegue ler/escrever dado do Tenant B via query da API.
 */
describe('Integração Multitenant (e2e)', () => {
  let app: INestApplication;

  const prismaMock = {
    user: { findUnique: jest.fn() },
    product: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn()
    }
  };

  // Guardiao Mockado que deixa a gente chavear a identidade HTTP lendo um header custom 'x-tenant-id'
  const mockAuthGuard = {
    canActivate: jest.fn((context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest();
      const tenantId = req.headers['x-tenant-id'];
      if (!tenantId) return false;

      // Injeta o ID de isolamento
      req.user = { id: tenantId, legacyId: `legacy-${tenantId}` };
      return true;
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(PrismaService)
    .useValue(prismaMock)
    .overrideGuard(AuthGuard)
    .useValue(mockAuthGuard)
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Bloqueios Multitenant - Produto', () => {

    it('Tenant A lista apenas seus próprios produtos', async () => {
      prismaMock.product.findMany.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/api/v2/products')
        .set('x-tenant-id', 'uuid-tenant-A')
        .expect(200);

      // Auditoria Mestre: A API vazou os filtros? Nao. Ela anexou o userId obrigatoriamente
      expect(prismaMock.product.findMany).toHaveBeenCalledWith({
        where: { userId: 'uuid-tenant-A' }
      });
    });

    it('Tenant B recebe 404 ao tentar consultar Produto do Tenant A (Tentativa de Leitura)', async () => {
      prismaMock.product.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/v2/products/produto-pertencente-ao-tenant-a')
        .set('x-tenant-id', 'uuid-tenant-B')
        .expect(404);

      expect(prismaMock.product.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'produto-pertencente-ao-tenant-a',
          userId: 'uuid-tenant-B'
        }
      });
    });

    it('Tenant B não consegue alterar status de Produto do Tenant A via bulk-status', async () => {
      prismaMock.product.updateMany.mockResolvedValue({ count: 0 });

      const res = await request(app.getHttpServer())
        .post('/api/v2/products/bulk-status')
        .set('x-tenant-id', 'uuid-tenant-B')
        .send({ productIds: ['produto-pertencente-ao-tenant-a'], status: 'INATIVO' })
        .expect(201);

      expect(res.body).toEqual({ updatedCount: 0 });
      expect(prismaMock.product.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'uuid-tenant-B',
          OR: [
            { id: { in: ['produto-pertencente-ao-tenant-a'] } },
            { legacyId: { in: ['produto-pertencente-ao-tenant-a'] } }
          ]
        },
        data: { status: 'INATIVO' }
      });
    });

    it('Tenant B recebe 404 ao tentar atualizar Produto do Tenant A (Tentativa Direta)', async () => {
      // A escrita tenant-scoped não encontra o Produto para este Tenant.
      prismaMock.product.updateMany.mockResolvedValue({ count: 0 });

      await request(app.getHttpServer())
        .put('/api/v2/products/produto-pertencente-ao-tenant-a')
        .set('x-tenant-id', 'uuid-tenant-B')
        .send({ name: 'Hackeado' })
        .expect(404);

      expect(prismaMock.product.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'produto-pertencente-ao-tenant-a',
          userId: 'uuid-tenant-B'
        },
        data: { name: 'Hackeado' }
      });

      // A tentativa de alteração real nunca usa uma escrita sem escopo de tenant.
      expect(prismaMock.product.update).not.toHaveBeenCalled();
      expect(prismaMock.product.findFirst).not.toHaveBeenCalled();
    });

    it('O Service NUNCA deve omitir o userId nas escritas', async () => {
      const updatedProduct = { id: 'meu-prod', userId: 'uuid-tenant-A', name: 'Meu Pote de Prata' };
      prismaMock.product.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.product.findFirst.mockResolvedValue(updatedProduct);

      await request(app.getHttpServer())
        .put('/api/v2/products/meu-prod')
        .set('x-tenant-id', 'uuid-tenant-A')
        .send({ name: 'Meu Pote de Prata' })
        .expect(200)
        .expect(updatedProduct);

      expect(prismaMock.product.updateMany).toHaveBeenCalledWith({
        where: { id: 'meu-prod', userId: 'uuid-tenant-A' },
        data: { name: 'Meu Pote de Prata' }
      });
      expect(prismaMock.product.update).not.toHaveBeenCalled();
      expect(prismaMock.product.findFirst).toHaveBeenCalledWith({
        where: { id: 'meu-prod', userId: 'uuid-tenant-A' }
      });
    });
  });
});
