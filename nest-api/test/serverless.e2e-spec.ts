import request from 'supertest';
let handler: typeof import('../dist/serverless').default;

describe('serverless CORS adapter (e2e)', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousAllowedOrigins = process.env.ALLOWED_ORIGINS;
  const allowedOrigin = 'https://catalog.preview.example';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    handler = (await import('../dist/serverless')).default;
    process.env.ALLOWED_ORIGINS = ` https://ignored.example, ${allowedOrigin} `;
  });

  afterAll(() => {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;

    if (previousAllowedOrigins === undefined) delete process.env.ALLOWED_ORIGINS;
    else process.env.ALLOWED_ORIGINS = previousAllowedOrigins;
  });

  it('answers an allowed preflight through the deployed handler', async () => {
    await request(handler as never)
      .options('/api/v1/public/catalog?slug=hive')
      .set('Origin', allowedOrigin)
      .set('Access-Control-Request-Method', 'GET')
      .expect(204)
      .expect('Access-Control-Allow-Origin', allowedOrigin)
      .expect('Access-Control-Allow-Credentials', 'true')
      .expect('Access-Control-Allow-Methods', /GET/);
  });

  it('does not grant an unapproved origin when NODE_ENV is not production', async () => {
    const response = await request(handler as never)
      .options('/api/v1/public/catalog?slug=hive')
      .set('Origin', 'https://not-allowed.example')
      .set('Access-Control-Request-Method', 'GET');

    expect(response.status).toBeLessThan(500);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    expect(response.headers['access-control-allow-credentials']).toBeUndefined();
  });
});
