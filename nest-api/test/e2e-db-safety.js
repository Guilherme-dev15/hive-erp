'use strict';

const E2E_DATABASE_NAME = 'hive_erp_e2e';
const E2E_DATABASE_USER = 'hive_e2e';
const ALLOWED_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

function assertE2EDatabase(env = process.env) {
  if (env.HIVE_E2E_DB_ENABLED !== 'true') {
    throw new Error('E2E database safety check failed: explicit E2E database opt-in is required.');
  }

  if (env.CI === 'true' && env.NODE_ENV !== 'test') {
    throw new Error('E2E database safety check failed: CI must run with NODE_ENV=test.');
  }

  if (env.NODE_ENV === 'production' || env.VERCEL_ENV === 'production') {
    throw new Error('E2E database safety check failed: production environments are not allowed.');
  }

  if (typeof env.DATABASE_URL !== 'string' || env.DATABASE_URL.length === 0) {
    throw new Error('E2E database safety check failed: DATABASE_URL is required.');
  }

  let databaseUrl;
  let databaseName;
  let username;
  try {
    databaseUrl = new URL(env.DATABASE_URL);
    databaseName = decodeURIComponent(databaseUrl.pathname.replace(/^\//, ''));
    username = decodeURIComponent(databaseUrl.username);
  } catch {
    throw new Error('E2E database safety check failed: DATABASE_URL is invalid.');
  }

  if (
    !['postgres:', 'postgresql:'].includes(databaseUrl.protocol) ||
    databaseUrl.hash !== '' ||
    databaseUrl.searchParams.has('host') ||
    databaseUrl.searchParams.has('hostaddr') ||
    databaseUrl.searchParams.has('options') ||
    databaseUrl.searchParams.has('service') ||
    databaseUrl.searchParams.has('servicefile') ||
    databaseUrl.searchParams.has('target_session_attrs')
  ) {
    throw new Error('E2E database safety check failed: DATABASE_URL is invalid.');
  }

  const expectedPort = env.CI === 'true' ? '5432' : '55432';

  if (
    databaseName !== E2E_DATABASE_NAME ||
    !ALLOWED_HOSTS.has(databaseUrl.hostname) ||
    databaseUrl.port !== expectedPort ||
    username !== E2E_DATABASE_USER ||
    !databaseUrl.password
  ) {
    throw new Error('E2E database safety check failed: target is not the dedicated local E2E database.');
  }

  return { databaseName };
}

module.exports = { assertE2EDatabase };
