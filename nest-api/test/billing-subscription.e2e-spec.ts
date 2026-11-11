import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthGuard } from '../src/auth/auth.guard';
import { Role, SetupBatchTier, SetupRequestStatus, SubscriptionStatus } from '@prisma/client';

const { assertE2EDatabase } = require('./e2e-db-safety') as { assertE2EDatabase: () => void };

describe('Phase B - Assinatura, Trial 14d, Order Bump Setup e Super-Admin (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const SUPER_ADMIN_ID = '00000000-0000-4000-8000-0000000000b1';
  const TENANT_B_LEGACY = 'e2e-phase-b-tenant-b-uid';
  const TENANT_B_EMAIL = 'e2e-phase-b-merchant@example.invalid';
  const TENANT_B_SLUG = 'e2e-phase-b-loja';

  beforeAll(async () => {
    assertE2EDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          const mode = req.headers['x-e2e-actor'] || 'merchant';

          if (mode === 'super-admin') {
            req.user = {
              id: SUPER_ADMIN_ID,
              legacyId: 'e2e-phase-b-admin-uid',
              email: 'guibanks1@gmail.com',
              role: Role.OWNER,
              isSuperAdmin: true,
            };
            return true;
          }

          if (mode === 'unprovisioned') {
            req.user = {
              id: null,
              legacyId: TENANT_B_LEGACY,
              email: TENANT_B_EMAIL,
              role: null,
              isSuperAdmin: false,
            };
            return true;
          }

          const merchantId = req.headers['x-e2e-user-id'] || null;
          req.user = {
            id: merchantId,
            legacyId: TENANT_B_LEGACY,
            email: TENANT_B_EMAIL,
            role: Role.OWNER,
            isSuperAdmin: false,
          };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await prisma.user.deleteMany({
      where: {
        OR: [
          { id: SUPER_ADMIN_ID },
          { legacyId: TENANT_B_LEGACY },
          { email: TENANT_B_EMAIL },
        ],
      },
    });

    await prisma.user.create({
      data: {
        id: SUPER_ADMIN_ID,
        email: 'guibanks1@gmail.com',
        name: 'Platform Admin E2E',
        role: Role.OWNER,
        active: true,
        legacyId: 'e2e-phase-b-admin-uid',
        config: {
          create: {
            storeName: 'Hive Platform E2E',
            publicSlug: 'e2e-phase-b-admin',
          },
        },
        subscription: {
          create: {
            status: SubscriptionStatus.ACTIVE,
            isExempt: true,
            trialStartsAt: new Date(),
            trialEndsAt: new Date(Date.now() + 14 * 86_400_000),
            activatedAt: new Date(),
          },
        },
      },
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({
        where: {
          OR: [
            { id: SUPER_ADMIN_ID },
            { legacyId: TENANT_B_LEGACY },
            { email: TENANT_B_EMAIL },
          ],
        },
      });
    }
    if (app) {
      await app.close();
    }
  });

  it('ciclo completo: onboard 14d trial -> bloqueio 402 ao expirar -> vitrine pública online -> Order Bump + ativação Super-Admin -> acesso restaurado', async () => {
    // 1. Onboarding cria loja + trial de 14 dias
    const onboardRes = await request(app.getHttpServer())
      .post('/api/v2/auth/onboard')
      .set('x-e2e-actor', 'unprovisioned')
      .send({
        storeName: 'Loja Teste Fase B',
        name: 'Lojista E2E',
        slug: TENANT_B_SLUG,
      })
      .expect(201);

    const tenantId = onboardRes.body.id as string;
    expect(onboardRes.body.subscription.effectiveStatus).toBe(SubscriptionStatus.TRIAL);
    expect(onboardRes.body.subscription.isBlocked).toBe(false);

    // 2. Durante trial, API operacional funciona e lojista não acessa /super-admin
    await request(app.getHttpServer())
      .get('/api/v2/products')
      .set('x-e2e-actor', 'merchant')
      .set('x-e2e-user-id', tenantId)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v2/super-admin/tenants')
      .set('x-e2e-actor', 'merchant')
      .set('x-e2e-user-id', tenantId)
      .expect(403);

    // 3. Super-Admin força expiração do trial -> painel bloqueia com 402 mas vitrine pública segue 200
    await request(app.getHttpServer())
      .patch(`/api/v2/super-admin/tenants/${tenantId}/subscription`)
      .set('x-e2e-actor', 'super-admin')
      .send({ action: 'EXPIRE_NOW', note: 'Teste E2E expiração' })
      .expect(200);

    const blockedRes = await request(app.getHttpServer())
      .get('/api/v2/products')
      .set('x-e2e-actor', 'merchant')
      .set('x-e2e-user-id', tenantId)
      .expect(402);
    expect(blockedRes.body.code).toBe('SUBSCRIPTION_EXPIRED');

    await request(app.getHttpServer())
      .get(`/api/v1/public/catalog?slug=${TENANT_B_SLUG}`)
      .expect(200);

    // 4. Lojista expirado cria checkout com Order Bump de 200 produtos
    const checkoutRes = await request(app.getHttpServer())
      .post('/api/v2/billing/checkout-intent')
      .set('x-e2e-actor', 'merchant')
      .set('x-e2e-user-id', tenantId)
      .send({
        setupBatchTier: SetupBatchTier.UP_TO_200,
        contactPhone: '11999990000',
        sourceDescription: 'Planilha fornecedor 180 peças',
      })
      .expect(201);

    expect(checkoutRes.body.setupRequestId).toBeTruthy();
    expect(checkoutRes.body.totalPriceCents).toBe(24600);

    // 5. Super-Admin marca Order Bump como PAID + ativa plano mensal em transação atômica
    const setupUpdateRes = await request(app.getHttpServer())
      .patch(`/api/v2/super-admin/setup-requests/${checkoutRes.body.setupRequestId}`)
      .set('x-e2e-actor', 'super-admin')
      .send({
        status: SetupRequestStatus.PAID,
        activateMonthlyPlanToo: true,
        adminNotes: 'Pix confirmado no E2E',
      })
      .expect(200);

    expect(setupUpdateRes.body.setupRequest.status).toBe(SetupRequestStatus.PAID);
    expect(setupUpdateRes.body.activatedSubscription.effectiveStatus).toBe(SubscriptionStatus.ACTIVE);
    expect(setupUpdateRes.body.activatedSubscription.isBlocked).toBe(false);

    // 6. Super-Admin importa lote de produtos diretamente para o lojista e conclui setup
    const importRes = await request(app.getHttpServer())
      .post(`/api/v2/super-admin/tenants/${tenantId}/import-products`)
      .set('x-e2e-actor', 'super-admin')
      .send({
        setupRequestId: checkoutRes.body.setupRequestId,
        products: [{ name: 'Anel Prata E2E', salePrice: 89.9, costPrice: 30, quantity: 10 }],
      })
      .expect(201);
    expect(importRes.body.count).toBe(1);

    // 7. Lojista volta a acessar painel operacional normalmente (200)
    const restoredProducts = await request(app.getHttpServer())
      .get('/api/v2/products')
      .set('x-e2e-actor', 'merchant')
      .set('x-e2e-user-id', tenantId)
      .expect(200);
    expect(restoredProducts.body).toHaveLength(1);
    expect(restoredProducts.body[0].name).toBe('Anel Prata E2E');
  });
});
