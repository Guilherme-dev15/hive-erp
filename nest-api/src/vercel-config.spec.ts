import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Vercel API routing', () => {
  const config = JSON.parse(
    readFileSync(resolve(__dirname, '../../vercel.json'), 'utf8')
  ) as {
    routes: Array<{
      src?: string;
      dest?: string;
      headers?: Record<string, string>;
    }>;
  };

  it('delegates API routing to Nest without static CORS headers', () => {
    const apiRoute = config.routes.find((route) => route.src === '/api/(.*)');

    expect(apiRoute).toBeDefined();
    expect(apiRoute?.dest).toBe('nest-api/src/serverless.ts');
    expect(apiRoute?.headers).toBeUndefined();
  });
});
