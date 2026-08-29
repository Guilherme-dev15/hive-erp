import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthGuard } from '../src/auth/auth.guard';
import { TransactionType } from '@prisma/client';

describe('Business Rules - Transações Financeiras (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const MOCK_USER_ID = '00000000-0000-4000-8000-000000000002';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: MOCK_USER_ID, legacyId: 'fake-tenant-biz2' };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await prisma.transaction.deleteMany({});
    await prisma.user.deleteMany({});

    await prisma.user.create({
      data: {
        id: MOCK_USER_ID,
        legacyId: 'fake-tenant-biz2',
        email: 'financeiro@business.com',
        name: 'Financeiro Biz',
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('deve criar uma nova transação financeira vinculada ao tenant', async () => {
    const transacaoPayload = {
      type: TransactionType.DESPESA,
      amount: 150.50,
      description: 'Pagamento de Fornecedor ABC',
      category: 'Fornecedores',
      date: new Date().toISOString(),
    };

    const response = await request(app.getHttpServer())
      .post('/api/v2/transactions')
      .send(transacaoPayload)
      .expect(200);

    expect(response.body.id).toBeDefined();

    const dbTransaction = await prisma.transaction.findUnique({
      where: { id: response.body.id },
    });

    expect(dbTransaction).toBeDefined();
    expect(Number(dbTransaction?.amount)).toBe(150.5);
    expect(dbTransaction?.userId).toBe(MOCK_USER_ID);
    expect(dbTransaction?.type).toBe(TransactionType.DESPESA);
  });

  it('deve listar apenas as transações do próprio tenant', async () => {
    await prisma.transaction.create({
      data: {
        userId: MOCK_USER_ID,
        type: TransactionType.VENDA,
        amount: 200,
        description: 'Venda Teste',
        date: new Date(),
      },
    });

    const OUTRO_TENANT_ID = '00000000-0000-4000-8000-000000000003';
    await prisma.user.create({
      data: { id: OUTRO_TENANT_ID, legacyId: 'fake-out', email: 'o@out.com', name: 'out' },
    });

    await prisma.transaction.create({
      data: {
        userId: OUTRO_TENANT_ID,
        type: TransactionType.CAPITAL,
        amount: 5000,
        description: 'Aporte Outro Tenant',
        date: new Date(),
      },
    });

    const response = await request(app.getHttpServer())
      .get('/api/v2/transactions')
      .expect(200);

    // Deve retornar apenas a Venda Teste do tenant logado (1 resultado)
    expect(response.body.length).toBe(1);
    expect(response.body[0].description).toBe('Venda Teste');
    expect(Number(response.body[0].amount)).toBe(200);
  });
});
