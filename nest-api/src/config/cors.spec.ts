import {
  createCorsOptions,
  DEFAULT_ALLOWED_ORIGINS,
  parseAllowedOrigins,
} from './cors';

describe('CORS policy', () => {
  it('uses exact production defaults when ALLOWED_ORIGINS is undefined', () => {
    expect(parseAllowedOrigins(undefined)).toEqual([
      ...DEFAULT_ALLOWED_ORIGINS,
    ]);
  });

  it('trims and removes empty configured origins', () => {
    expect(
      parseAllowedOrigins(' https://one.example, ,https://two.example ')
    ).toEqual(['https://one.example', 'https://two.example']);
  });

  it('does not silently restore defaults for an explicitly empty value', () => {
    expect(parseAllowedOrigins('')).toEqual([]);
  });

  it('accepts only exact origins and never wildcard credentials', () => {
    const options = createCorsOptions(['https://allowed.example']);
    const origin = options.origin;
    if (typeof origin !== 'function') {
      throw new Error('Expected a dynamic origin callback');
    }

    const allowed = jest.fn();
    origin('https://allowed.example', allowed);
    expect(allowed).toHaveBeenCalledWith(null, true);

    const denied = jest.fn();
    origin('https://allowed.example.attacker.example', denied);
    expect(denied.mock.calls[0]?.[0]).toBeInstanceOf(Error);
    expect(options.credentials).toBe(true);
    expect(options.origin).not.toBe('*');
  });

  it('allows server-to-server requests without an Origin header', () => {
    const options = createCorsOptions(['https://allowed.example']);
    const origin = options.origin;
    if (typeof origin !== 'function') {
      throw new Error('Expected a dynamic origin callback');
    }

    const callback = jest.fn();
    origin(undefined, callback);
    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('terminates preflight requests with 204', () => {
    const options = createCorsOptions(['https://allowed.example']);
    expect(options.optionsSuccessStatus).toBe(204);
    expect(options.preflightContinue).not.toBe(true);
    expect(options.methods).toContain('OPTIONS');
  });
});

export {};
