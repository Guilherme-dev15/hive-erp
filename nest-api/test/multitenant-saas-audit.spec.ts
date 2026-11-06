import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthGuard } from '../src/auth/auth.guard';
import { OrderStatus, Role } from '@prisma/client';

/**
 * ============================================================================
 * SPRINT 3 — AUDITORIA E2E MULTITENANT & ONBOARDING SAAS
 * Regra 4 do Prompt Especialista:
 * "Multitenancy é auditada, não assumida. Exija teste de integração que prove:
 *  usuário do Tenant A não consegue ler/escrever dado do Tenant B via query da API."
 * ============================================================================
 */
describe('Auditoria E2E Multitenant & Onboarding SaaS (Regra 4)', () => {
  let app: INestApplication;

  const prismaMock: any = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    config: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    productVariant: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    inventoryLog: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    order: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      aggregate: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
      groupBy: jest.fn(),
    },
    coupon: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    },
    supplier: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((cb: any) => cb(prismaMock)),
  };

  // Guardião mockado para simular identidade e tenant HTTP
  const mockAuthGuard = {
    canActivate: jest.fn((context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest();
      const tenantId = req.headers['x-tenant-id'];
      const tenantEmail = req.headers['x-tenant-email'];

      if (!tenantId) return false;

      // Injeta o ID e identidade de isolamento do inquilino
      req.user = {
        id: tenantId === 'unprovisioned' ? null : tenantId,
        legacyId: `firebase-uid-${tenantId}`,
        email: tenantEmail || `${tenantId}@lojista.com`,
      };
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
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // 1. ONBOARDING & AUTENTICAÇÃO SAAS
  // ==========================================================================
  describe('1. Onboarding & Autenticação de Inquilinos', () => {
    it('Tenant B se auto-cadastra com sucesso via POST /api/v2/auth/onboard', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.config.findFirst.mockResolvedValue(null);

      const createdUser = {
        id: 'uuid-tenant-B',
        name: 'Maria Joalheira',
        email: 'maria@pratasbrasil.com',
        role: Role.OWNER,
        active: true,
        legacyId: 'firebase-uid-tenant-B',
        config: {
          id: 'cfg-tenant-b',
          storeName: 'Pratas do Brasil',
          publicSlug: 'pratas-brasil',
        },
      };
      prismaMock.user.create.mockResolvedValue(createdUser);

      const res = await request(app.getHttpServer())
        .post('/api/v2/auth/onboard')
        .set('x-tenant-id', 'unprovisioned')
        .set('x-tenant-email', 'maria@pratasbrasil.com')
        .send({
          storeName: 'Pratas do Brasil',
          name: 'Maria Joalheira',
          slug: 'pratas-brasil',
        })
        .expect(201);

      expect(res.body).toEqual({
        id: 'uuid-tenant-B',
        name: 'Maria Joalheira',
        email: 'maria@pratasbrasil.com',
        role: 'admin',
        active: true,
        isNew: true,
        store: {
          id: 'cfg-tenant-b',
          storeName: 'Pratas do Brasil',
          slug: 'pratas-brasil',
        },
      });

      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'maria@pratasbrasil.com',
            name: 'Maria Joalheira',
            role: 'OWNER',
            active: true,
            config: {
              create: expect.objectContaining({
                storeName: 'Pratas do Brasil',
                publicSlug: 'pratas-brasil',
              }),
            },
          }),
        }),
      );
    });

    it('Tenant B é impedido com 409 Conflict de roubar o slug "hive" do Tenant A', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      // Config do Tenant A já existe com slug 'hive'
      prismaMock.config.findFirst.mockResolvedValue({ id: 'cfg-tenant-a', publicSlug: 'hive' });

      const res = await request(app.getHttpServer())
        .post('/api/v2/auth/onboard')
        .set('x-tenant-id', 'unprovisioned')
        .set('x-tenant-email', 'atacante@exemplo.com')
        .send({
          storeName: 'Loja Invasora',
          slug: 'hive',
        })
        .expect(409);

      expect(res.body.message).toContain('Slug já está em uso por outro lojista');
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it('GET /api/v2/auth/me retorna exclusivamente o perfil do inquilino requisitante', async () => {
      const userA = { id: 'uuid-tenant-A', name: 'Tenant A', email: 'a@hive.com', role: 'OWNER', active: true };
      const userB = { id: 'uuid-tenant-B', name: 'Tenant B', email: 'b@pratas.com', role: 'OWNER', active: true };

      prismaMock.user.findUnique.mockResolvedValueOnce(userA).mockResolvedValueOnce(userB);

      const resA = await request(app.getHttpServer())
        .get('/api/v2/auth/me')
        .set('x-tenant-id', 'uuid-tenant-A')
        .expect(200);

      const resB = await request(app.getHttpServer())
        .get('/api/v2/auth/me')
        .set('x-tenant-id', 'uuid-tenant-B')
        .expect(200);

      expect(resA.body.id).toBe('uuid-tenant-A');
      expect(resB.body.id).toBe('uuid-tenant-B');
    });
  });

  // ==========================================================================
  // 2. ISOLAMENTO DE PRODUTOS & CATÁLOGO
  // ==========================================================================
  describe('2. Isolamento de Produtos & Catálogo', () => {
    it('Tenant B toma 404 ao tentar inspecionar produto pertencente a Tenant A', async () => {
      prismaMock.product.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/v2/products/produto-privado-tenant-a')
        .set('x-tenant-id', 'uuid-tenant-B')
        .expect(404);

      expect(prismaMock.product.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'produto-privado-tenant-a',
          userId: 'uuid-tenant-B',
        },
      });
    });

    it('Tenant B toma 404 ao tentar atualizar produto de Tenant A', async () => {
      prismaMock.product.updateMany.mockResolvedValue({ count: 0 });

      await request(app.getHttpServer())
        .put('/api/v2/products/produto-privado-tenant-a')
        .set('x-tenant-id', 'uuid-tenant-B')
        .send({ name: 'Nome Invasor' })
        .expect(404);

      expect(prismaMock.product.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'produto-privado-tenant-a',
          userId: 'uuid-tenant-B',
        },
        data: { name: 'Nome Invasor' },
      });
      expect(prismaMock.product.update).not.toHaveBeenCalled();
    });

    it('Tenant B tem bulk-status ignorado (count: 0) ao passar IDs de Tenant A', async () => {
      prismaMock.product.updateMany.mockResolvedValue({ count: 0 });

      const res = await request(app.getHttpServer())
        .post('/api/v2/products/bulk-status')
        .set('x-tenant-id', 'uuid-tenant-B')
        .send({ productIds: ['prod-a-1', 'prod-a-2'], status: 'INATIVO' })
        .expect(201);

      expect(res.body).toEqual({ updatedCount: 0 });
      expect(prismaMock.product.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'uuid-tenant-B',
          OR: [{ id: { in: ['prod-a-1', 'prod-a-2'] } }, { legacyId: { in: ['prod-a-1', 'prod-a-2'] } }],
        },
        data: { status: 'INATIVO' },
      });
    });
  });

  // ==========================================================================
  // 3. ISOLAMENTO DE ESTOQUE (INVENTORY)
  // ==========================================================================
  describe('3. Isolamento de Estoque & Movimentações', () => {
    it('Tenant B toma 404 ao tentar ajustar estoque de produto de Tenant A', async () => {
      prismaMock.product.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/v2/inventory/produto-tenant-a/adjust')
        .set('x-tenant-id', 'uuid-tenant-B')
        .send({ type: 'entry', quantity: 50, userName: 'Invasor' })
        .expect(404);

      expect(prismaMock.product.findFirst).toHaveBeenCalledWith({
        where: { id: 'produto-tenant-a', userId: 'uuid-tenant-B' },
      });
      expect(prismaMock.product.update).not.toHaveBeenCalled();
      expect(prismaMock.inventoryLog.create).not.toHaveBeenCalled();
    });

    it('Tenant B busca logs de estoque filtrando exclusivamente por seu userId', async () => {
      prismaMock.inventoryLog.findMany.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/api/v2/inventory/produto-tenant-a/logs')
        .set('x-tenant-id', 'uuid-tenant-B')
        .expect(200);

      expect(prismaMock.inventoryLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { productId: 'produto-tenant-a', userId: 'uuid-tenant-B' },
        }),
      );
    });
  });

  // ==========================================================================
  // 4. ISOLAMENTO DE PEDIDOS (ORDERS)
  // ==========================================================================
  describe('4. Isolamento de Pedidos (Orders)', () => {
    it('Tenant B lista pedidos filtrando exclusivamente por seu userId', async () => {
      prismaMock.order.findMany.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/api/v2/orders')
        .set('x-tenant-id', 'uuid-tenant-B')
        .expect(200);

      expect(prismaMock.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'uuid-tenant-B' },
        }),
      );
    });

    it('Tenant B toma 404 ao tentar consultar detalhes de pedido do Tenant A', async () => {
      prismaMock.order.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/v2/orders/pedido-secreto-tenant-a')
        .set('x-tenant-id', 'uuid-tenant-B')
        .expect(404);

      expect(prismaMock.order.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pedido-secreto-tenant-a', userId: 'uuid-tenant-B' },
        }),
      );
    });

    it('Tenant B toma 404 ao tentar alterar status de pedido do Tenant A', async () => {
      prismaMock.order.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch('/api/v2/orders/pedido-secreto-tenant-a/status')
        .set('x-tenant-id', 'uuid-tenant-B')
        .send({ status: 'Cancelado' })
        .expect(404);

      expect(prismaMock.order.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pedido-secreto-tenant-a', userId: 'uuid-tenant-B' },
        }),
      );
      expect(prismaMock.order.update).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // 5. ISOLAMENTO FINANCEIRO & CAIXA (TRANSACTIONS)
  // ==========================================================================
  describe('5. Isolamento Financeiro & Caixa (Transactions)', () => {
    it('Tenant B lista transações filtrando exclusivamente por seu userId', async () => {
      prismaMock.transaction.findMany.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/api/v2/transactions')
        .set('x-tenant-id', 'uuid-tenant-B')
        .expect(200);

      expect(prismaMock.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'uuid-tenant-B' },
        }),
      );
    });

    it('Tenant B toma 404 ao tentar editar transação financeira do Tenant A', async () => {
      prismaMock.transaction.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .put('/api/v2/transactions/transacao-caixa-tenant-a')
        .set('x-tenant-id', 'uuid-tenant-B')
        .send({ amount: 99999 })
        .expect(404);

      expect(prismaMock.transaction.findFirst).toHaveBeenCalledWith({
        where: { id: 'transacao-caixa-tenant-a', userId: 'uuid-tenant-B' },
      });
      expect(prismaMock.transaction.update).not.toHaveBeenCalled();
    });

    it('Tenant B deleta transação com escopo restrito a seu userId', async () => {
      prismaMock.transaction.deleteMany.mockResolvedValue({ count: 0 });

      await request(app.getHttpServer())
        .delete('/api/v2/transactions/transacao-caixa-tenant-a')
        .set('x-tenant-id', 'uuid-tenant-B')
        .expect(200);

      expect(prismaMock.transaction.deleteMany).toHaveBeenCalledWith({
        where: { id: 'transacao-caixa-tenant-a', userId: 'uuid-tenant-B' },
      });
    });
  });

  // ==========================================================================
  // 6. ISOLAMENTO DE CAMPANHAS PROMOCIONAIS
  // ==========================================================================
  describe('6. Isolamento de Campanhas Promocionais', () => {
    it('Tenant B simula campanha apenas sobre seus próprios produtos ativos', async () => {
      prismaMock.product.findMany.mockResolvedValue([]);

      await request(app.getHttpServer())
        .post('/api/v2/campaign/simulate')
        .set('x-tenant-id', 'uuid-tenant-B')
        .send({ discount: 10, minMarkup: 1.5 })
        .expect(201);

      expect(prismaMock.product.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'uuid-tenant-B',
          status: 'ATIVO',
        },
      });
    });

    it('Tenant B reverte campanha alterando exclusivamente variantes de seu userId', async () => {
      prismaMock.productVariant.findMany.mockResolvedValue([]);

      await request(app.getHttpServer())
        .post('/api/v2/campaign/revert')
        .set('x-tenant-id', 'uuid-tenant-B')
        .expect(201);

      expect(prismaMock.productVariant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            skuSuffix: '__CAMPAIGN_BACKUP__',
            product: expect.objectContaining({
              userId: 'uuid-tenant-B',
            }),
          }),
        }),
      );
    });
  });

  // ==========================================================================
  // 7. ISOLAMENTO DE CUPONS
  // ==========================================================================
  describe('7. Isolamento de Cupons', () => {
    it('Tenant B lista cupons com filtro estrito de seu userId', async () => {
      prismaMock.coupon.findMany.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/api/v2/coupons')
        .set('x-tenant-id', 'uuid-tenant-B')
        .expect(200);

      expect(prismaMock.coupon.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'uuid-tenant-B' },
        }),
      );
    });

    it('Tenant B toma 404 ao tentar apagar cupom do Tenant A', async () => {
      prismaMock.coupon.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete('/api/v2/coupons/cupom-secreto-tenant-a')
        .set('x-tenant-id', 'uuid-tenant-B')
        .expect(404);

      expect(prismaMock.coupon.findFirst).toHaveBeenCalledWith({
        where: { id: 'cupom-secreto-tenant-a', userId: 'uuid-tenant-B' },
      });
      expect(prismaMock.coupon.delete).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // 8. ISOLAMENTO DE FORNECEDORES & CATEGORIAS
  // ==========================================================================
  describe('8. Isolamento de Fornecedores & Categorias', () => {
    it('Tenant B toma 404 ao tentar editar fornecedor do Tenant A', async () => {
      prismaMock.supplier.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .put('/api/v2/suppliers/fornecedor-tenant-a')
        .set('x-tenant-id', 'uuid-tenant-B')
        .send({ name: 'Fornecedor Alterado' })
        .expect(404);

      expect(prismaMock.supplier.findFirst).toHaveBeenCalledWith({
        where: { id: 'fornecedor-tenant-a', userId: 'uuid-tenant-B' },
      });
      expect(prismaMock.supplier.update).not.toHaveBeenCalled();
    });

    it('Tenant B toma 404 ao tentar deletar categoria do Tenant A', async () => {
      prismaMock.category.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete('/api/v2/categories/categoria-tenant-a')
        .set('x-tenant-id', 'uuid-tenant-B')
        .expect(404);

      expect(prismaMock.category.findFirst).toHaveBeenCalledWith({
        where: { id: 'categoria-tenant-a', userId: 'uuid-tenant-B' },
      });
      expect(prismaMock.category.delete).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // 9. ISOLAMENTO DE DASHBOARD & MÉTRICAS GERENCIAIS
  // ==========================================================================
  describe('9. Isolamento de Dashboard & Métricas', () => {
    it('Tenant B consulta dashboard e todas as agregações forçam userId: Tenant B', async () => {
      prismaMock.order.aggregate.mockResolvedValue({ _count: { id: 0 }, _sum: { total: 0 } });
      prismaMock.product.count.mockResolvedValue(0);
      prismaMock.transaction.groupBy.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get('/api/v2/dashboard/stats')
        .set('x-tenant-id', 'uuid-tenant-B')
        .expect(200);

      expect(res.body.stats.totalVendas).toBe(0);
      expect(res.body.stats.activeProducts).toBe(0);

      // Auditoria: Order aggregate filtrou por Tenant B
      expect(prismaMock.order.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'uuid-tenant-B',
            status: OrderStatus.CONCLUIDO,
          }),
        }),
      );

      // Auditoria: Transaction groupBy filtrou por Tenant B
      expect(prismaMock.transaction.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'uuid-tenant-B' },
        }),
      );
    });

    it('Tenant B consulta Curva ABC e a consulta de produtos é restrita a Tenant B', async () => {
      prismaMock.product.findMany.mockResolvedValue([]);
      prismaMock.order.aggregate.mockResolvedValue({ _count: { id: 0 }, _sum: { total: 0 } });

      await request(app.getHttpServer())
        .get('/api/v2/reports/abc')
        .set('x-tenant-id', 'uuid-tenant-B')
        .expect(200);

      expect(prismaMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'uuid-tenant-B', status: 'ATIVO' },
        }),
      );
    });
  });

  // ==========================================================================
  // 10. ISOLAMENTO DE CONFIGURAÇÃO DA LOJA
  // ==========================================================================
  describe('10. Isolamento de Configurações da Loja', () => {
    it('Tenant B obtém configurações vinculadas exclusivamente ao seu userId', async () => {
      const configB = { id: 'cfg-b', userId: 'uuid-tenant-B', storeName: 'Pratas do Brasil', publicSlug: 'pratas-brasil' };
      prismaMock.config.findUnique.mockResolvedValue(configB);

      const res = await request(app.getHttpServer())
        .get('/api/v2/config')
        .set('x-tenant-id', 'uuid-tenant-B')
        .expect(200);

      expect(res.body.storeName).toBe('Pratas do Brasil');
      expect(prismaMock.config.findUnique).toHaveBeenCalledWith({
        where: { userId: 'uuid-tenant-B' },
      });
    });

    it('Tenant B atualiza configurações através de upsert vinculado ao seu userId', async () => {
      const updatedConfig = { id: 'cfg-b', userId: 'uuid-tenant-B', storeName: 'Pratas Brasil Oficial', publicSlug: 'pratas-oficial' };
      prismaMock.config.upsert.mockResolvedValue(updatedConfig);

      const res = await request(app.getHttpServer())
        .put('/api/v2/config')
        .set('x-tenant-id', 'uuid-tenant-B')
        .send({ storeName: 'Pratas Brasil Oficial', slug: 'pratas-oficial' })
        .expect(200);

      expect(res.body.storeName).toBe('Pratas Brasil Oficial');
      expect(prismaMock.config.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'uuid-tenant-B' },
          create: expect.objectContaining({ userId: 'uuid-tenant-B' }),
        }),
      );
    });
  });

  // ==========================================================================
  // 11. ISOLAMENTO DE CLIENTES / CRM (NOVO DOMÍNIO)
  // ==========================================================================
  describe('11. Isolamento de Clientes (CRM)', () => {
    it('Tenant B consulta clientes e a busca de pedidos é restrita exclusivamente a userId: Tenant B', async () => {
      prismaMock.order.findMany.mockResolvedValue([
        {
          id: 'ord-b-1',
          userId: 'uuid-tenant-B',
          customerName: 'Cliente do Tenant B',
          customerPhone: '11999998888',
          status: OrderStatus.CONCLUIDO,
          total: 199.9,
          createdAt: new Date(),
          items: [{ id: 'item-1' }],
        },
      ]);

      const res = await request(app.getHttpServer())
        .get('/api/v2/customers')
        .set('x-tenant-id', 'uuid-tenant-B')
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.data[0].name).toBe('Cliente do Tenant B');
      expect(prismaMock.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'uuid-tenant-B' },
        }),
      );
    });

    it('Tenant B não consegue ler cliente que pertence exclusivamente aos pedidos do Tenant A', async () => {
      // Mock retorna apenas pedidos do Tenant B (que não contém o cliente do Tenant A)
      prismaMock.order.findMany.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/api/v2/customers/11999991111') // Telefone do cliente do Tenant A
        .set('x-tenant-id', 'uuid-tenant-B')
        .expect(404);

      expect(prismaMock.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'uuid-tenant-B' },
        }),
      );
    });
  });
});
