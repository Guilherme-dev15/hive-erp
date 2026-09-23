import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductStatus } from '@prisma/client';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('PublicCatalogController (e2e)', () => {
  let app: INestApplication;
  let prisma: {
    config: { findFirst: jest.Mock };
    product: { findMany: jest.Mock };
    category: { findMany: jest.Mock };
  };
  const previousNodeEnv = process.env.NODE_ENV;
  const previousAllowedOrigins = process.env.ALLOWED_ORIGINS;

  beforeAll(async () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOWED_ORIGINS = 'https://catalog.preview.example';

    prisma = {
      config: { findFirst: jest.fn() },
      product: { findMany: jest.fn() },
      category: { findMany: jest.fn() },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    app.enableCors({
      origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
        const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean);

        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      optionsSuccessStatus: 204,
      credentials: true,
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();

    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;

    if (previousAllowedOrigins === undefined) delete process.env.ALLOWED_ORIGINS;
    else process.env.ALLOWED_ORIGINS = previousAllowedOrigins;
  });

  beforeEach(() => {
    prisma.config.findFirst.mockReset();
    prisma.product.findMany.mockReset();
    prisma.category.findMany.mockReset();
  });

  it('returns the public v1 envelope with no-store and tenant-scoped data', async () => {
    prisma.config.findFirst.mockResolvedValue({
      userId: 'tenant-a',
      storeName: 'Hive',
      publicSlug: 'hive',
      primaryColor: '#D4AF37',
      secondaryColor: '#343434',
      whatsappNumber: null,
      banners: [],
      lowStockThreshold: 5,
    });
    prisma.product.findMany.mockResolvedValue([
      {
        id: 'product-a',
        name: 'Produto A',
        code: 'A-1',
        categoryId: 'category-a',
        subcategory: null,
        description: null,
        salePrice: 10,
        imageUrl: null,
        quantity: 1,
        status: ProductStatus.ATIVO,
        variants: [],
        costPrice: 999,
        userId: 'tenant-a',
      },
    ]);
    prisma.category.findMany.mockResolvedValue([{ id: 'category-a', name: 'Categoria A' }]);

    const response = await request(app.getHttpServer())
      .get('/api/v1/public/catalog')
      .query({ slug: 'hive' })
      .set('Origin', 'https://catalog.preview.example')
      .expect(200);

    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['access-control-allow-origin']).toBe('https://catalog.preview.example');
    expect(response.body).toEqual({
      version: 'v1',
      data: {
        config: {
          storeName: 'Hive',
          slug: 'hive',
          primaryColor: '#D4AF37',
          secondaryColor: '#343434',
          whatsappNumber: null,
          banners: [],
          lowStockThreshold: 5,
        },
        produtos: [expect.objectContaining({ id: 'product-a', category: 'Categoria A', status: 'ativo' })],
        categorias: [{ id: 'category-a', name: 'Categoria A' }],
      },
    });
    expect(JSON.stringify(response.body)).not.toContain('costPrice');
    expect(JSON.stringify(response.body)).not.toContain('userId');
    expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'tenant-a', status: ProductStatus.ATIVO },
    }));
    expect(prisma.category.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'tenant-a', id: { in: ['category-a'] } },
    }));
  });

  it('returns 400 for missing, malformed, or tenant-spoofing query parameters', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/public/catalog')
      .expect(400);

    await request(app.getHttpServer())
      .get('/api/v1/public/catalog')
      .query({ slug: 'HIVE' })
      .expect(400);

    await request(app.getHttpServer())
      .get('/api/v1/public/catalog')
      .query({ slug: 'hive', storeId: 'tenant-b' })
      .expect(400);

    expect(prisma.config.findFirst).not.toHaveBeenCalled();
  });

  it('returns 404 for an unknown or inactive tenant', async () => {
    prisma.config.findFirst.mockResolvedValue(null);

    await request(app.getHttpServer())
      .get('/api/v1/public/catalog')
      .query({ slug: 'unknown' })
      .expect(404);

    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  it('does not turn a dependency failure into an empty catalog', async () => {
    prisma.config.findFirst.mockRejectedValue(new Error('database unavailable'));

    await request(app.getHttpServer())
      .get('/api/v1/public/catalog')
      .query({ slug: 'hive' })
      .expect(500);
  });

  it('answers an allowed CORS preflight without invoking the catalog query', async () => {
    await request(app.getHttpServer())
      .options('/api/v1/public/catalog?slug=hive')
      .set('Origin', 'https://catalog.preview.example')
      .set('Access-Control-Request-Method', 'GET')
      .expect(204)
      .expect('Access-Control-Allow-Origin', 'https://catalog.preview.example');

    expect(prisma.config.findFirst).not.toHaveBeenCalled();
  });

  it('does not grant CORS access to an unapproved origin', async () => {
    await request(app.getHttpServer())
      .options('/api/v1/public/catalog?slug=hive')
      .set('Origin', 'https://not-allowed.example')
      .set('Access-Control-Request-Method', 'GET')
      .expect((response) => {
        expect(response.headers['access-control-allow-origin']).toBeUndefined();
      });
  });
});
