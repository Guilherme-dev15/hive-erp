import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type Environment = NodeJS.ProcessEnv;

export interface MigrationOptions {
  credentials: Record<string, unknown>;
  dryRun: boolean;
}

function validateCredentials(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    throw new Error('Firebase credentials must be a JSON object.');
  }

  const credentials = value as Record<string, unknown>;
  for (const field of ['project_id', 'client_email', 'private_key']) {
    if (typeof credentials[field] !== 'string' || !credentials[field]) {
      throw new Error(`Firebase credentials are missing the ${field} field.`);
    }
  }

  return credentials;
}

function readCredentials(env: Environment): Record<string, unknown> {
  const inline = env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (inline) {
    try {
      return validateCredentials(JSON.parse(inline));
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.');
    }
  }

  const configuredPath = env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (!configuredPath) {
    throw new Error(
      'Firebase credentials are not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS.',
    );
  }

  const credentialPath = resolve(configuredPath);
  if (!existsSync(credentialPath)) {
    throw new Error('The file configured by GOOGLE_APPLICATION_CREDENTIALS was not found.');
  }

  try {
    return validateCredentials(JSON.parse(readFileSync(credentialPath, 'utf8')));
  } catch {
    throw new Error('The file configured by GOOGLE_APPLICATION_CREDENTIALS is not valid JSON.');
  }
}

export function parseMigrationOptions(
  argv: string[] = process.argv.slice(2),
  env: Environment = process.env,
): MigrationOptions {
  if (!env.DATABASE_URL?.trim()) {
    throw new Error('DATABASE_URL is required before running the migration.');
  }

  return {
    credentials: readCredentials(env),
    dryRun: argv.includes('--dry-run'),
  };
}
