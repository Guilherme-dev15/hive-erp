import { assertE2EDatabase } from './e2e-db-safety';

describe('E2E database safety', () => {
  const validEnvironment = {
    HIVE_E2E_DB_ENABLED: 'true',
    DATABASE_URL: 'postgresql://hive_e2e:synthetic-password@127.0.0.1:55432/hive_erp_e2e?schema=public',
    NODE_ENV: 'test',
  };

  it('rejects a missing explicit opt-in', () => {
    expect(() => assertE2EDatabase({ ...validEnvironment, HIVE_E2E_DB_ENABLED: undefined }))
      .toThrow(/explicit E2E database opt-in/);
  });

  it('rejects an absent URL and a non-dedicated target without exposing secrets', () => {
    expect(() => assertE2EDatabase({ ...validEnvironment, DATABASE_URL: undefined }))
      .toThrow(/DATABASE_URL is required/);

    const secretUrl = 'postgresql://user:do-not-print@remote.example:5432/mydb';
    try {
      assertE2EDatabase({ ...validEnvironment, DATABASE_URL: secretUrl });
      throw new Error('Expected invalid destination to be rejected');
    } catch (error) {
      expect(error.message).toMatch(/dedicated local E2E database/);
      expect(error.message).not.toContain('do-not-print');
      expect(error.message).not.toContain(secretUrl);
    }
  });

  it('rejects development database names, remote hosts, and production environments', () => {
    expect(() => assertE2EDatabase({
      ...validEnvironment,
      DATABASE_URL: 'postgresql://hive_e2e:synthetic-password@127.0.0.1:55432/mydb?schema=public',
    })).toThrow(/dedicated local E2E database/);
    expect(() => assertE2EDatabase({
      ...validEnvironment,
      DATABASE_URL: 'postgresql://hive_e2e:synthetic-password@db.example:55432/hive_erp_e2e?schema=public',
    })).toThrow(/dedicated local E2E database/);
    expect(() => assertE2EDatabase({ ...validEnvironment, NODE_ENV: 'production' }))
      .toThrow(/production environments are not allowed/);
    expect(() => assertE2EDatabase({ ...validEnvironment, VERCEL_ENV: 'production' }))
      .toThrow(/production environments are not allowed/);
  });

  it('accepts the dedicated local E2E database', () => {
    expect(assertE2EDatabase(validEnvironment)).toEqual({ databaseName: 'hive_erp_e2e' });
  });

  it('accepts CI only on the isolated PostgreSQL service port in test mode', () => {
    expect(assertE2EDatabase({
      ...validEnvironment,
      CI: 'true',
      DATABASE_URL: 'postgresql://hive_e2e:synthetic-password@127.0.0.1:5432/hive_erp_e2e?schema=public',
    })).toEqual({ databaseName: 'hive_erp_e2e' });

    expect(() => assertE2EDatabase({
      ...validEnvironment,
      CI: 'true',
      DATABASE_URL: validEnvironment.DATABASE_URL,
    })).toThrow(/dedicated local E2E database/);
    expect(() => assertE2EDatabase({
      ...validEnvironment,
      CI: 'true',
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://hive_e2e:synthetic-password@127.0.0.1:5432/hive_erp_e2e?schema=public',
    })).toThrow(/CI must run with NODE_ENV=test/);
  });

  it('rejects malformed URL components and driver-level host overrides', () => {
    expect(() => assertE2EDatabase({
      ...validEnvironment,
      DATABASE_URL: 'postgresql://hive_e2e:synthetic-password@127.0.0.1:55432/hive_erp_e2e%ZZ?schema=public',
    })).toThrow(/DATABASE_URL is invalid/);
    expect(() => assertE2EDatabase({
      ...validEnvironment,
      DATABASE_URL: 'postgresql://hive_e2e:synthetic-password@127.0.0.1:55432/hive_erp_e2e?host=db.example',
    })).toThrow(/DATABASE_URL is invalid/);
    expect(() => assertE2EDatabase({
      ...validEnvironment,
      DATABASE_URL: 'postgresql://hive_e2e:synthetic-password@127.0.0.1:55432/hive_erp_e2e#remote.example',
    })).toThrow(/DATABASE_URL is invalid/);
  });
});
