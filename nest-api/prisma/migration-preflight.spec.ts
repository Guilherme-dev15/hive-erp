import { parseMigrationOptions } from './migration-preflight';

describe('migration preflight', () => {
  const credentials = JSON.stringify({
    project_id: 'test-project',
    client_email: 'migration@example.test',
    private_key: 'test-key',
  });

  it('requires the database URL', () => {
    expect(() =>
      parseMigrationOptions([], {
        FIREBASE_SERVICE_ACCOUNT_JSON: credentials,
      }),
    ).toThrow('DATABASE_URL is required');
  });

  it('requires external Firebase credentials', () => {
    expect(() => parseMigrationOptions([], { DATABASE_URL: 'postgresql://test' })).toThrow(
      'Firebase credentials are not configured',
    );
  });

  it('accepts inline credentials and dry-run mode', () => {
    expect(
      parseMigrationOptions(['--dry-run'], {
        DATABASE_URL: 'postgresql://test',
        FIREBASE_SERVICE_ACCOUNT_JSON: credentials,
      }),
    ).toEqual({
      credentials: {
        project_id: 'test-project',
        client_email: 'migration@example.test',
        private_key: 'test-key',
      },
      dryRun: true,
    });
  });

  it('rejects malformed inline credentials', () => {
    expect(() =>
      parseMigrationOptions([], {
        DATABASE_URL: 'postgresql://test',
        FIREBASE_SERVICE_ACCOUNT_JSON: '{invalid',
      }),
    ).toThrow('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON');
  });
});
