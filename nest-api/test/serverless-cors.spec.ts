import { createCorsOptions, getAllowedOrigins } from '../src/serverless';

describe('serverless CORS configuration', () => {
  const originalAllowedOrigins = process.env.ALLOWED_ORIGINS;

  afterEach(() => {
    if (originalAllowedOrigins === undefined) {
      delete process.env.ALLOWED_ORIGINS;
    } else {
      process.env.ALLOWED_ORIGINS = originalAllowedOrigins;
    }
  });

  it('parses configured origins without exposing or broadening them', () => {
    process.env.ALLOWED_ORIGINS = 'https://admin.example, https://catalog.example';

    expect(getAllowedOrigins()).toEqual([
      'https://admin.example',
      'https://catalog.example',
    ]);
  });

  it('allows server-to-server requests without an Origin header', () => {
    const callback = jest.fn();

    createCorsOptions().origin(undefined, callback);

    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('allows a configured browser origin and rejects an unknown one', () => {
    process.env.ALLOWED_ORIGINS = 'https://admin.example';
    const allowedCallback = jest.fn();
    const rejectedCallback = jest.fn();

    createCorsOptions().origin('https://admin.example', allowedCallback);
    createCorsOptions().origin('https://evil.example', rejectedCallback);

    expect(allowedCallback).toHaveBeenCalledWith(null, true);
    expect(rejectedCallback.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('disables preflight continuation and uses 204 for successful OPTIONS', () => {
    const options = createCorsOptions();

    expect(options.preflightContinue).toBe(false);
    expect(options.optionsSuccessStatus).toBe(204);
  });
});
