import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nestApiDir = path.resolve(__dirname, '../nest-api');

const isVercel = Boolean(process.env.VERCEL);
const isProductionVercel = process.env.VERCEL_ENV === 'production';
const forceMigrate = process.env.FORCE_MIGRATE_DEPLOY === 'true';

if (!process.env.DATABASE_URL) {
  console.log('[migrations] DATABASE_URL não definida no ambiente de build. Pulando migrate deploy.');
  process.exit(0);
}

if (isVercel && !isProductionVercel && !forceMigrate) {
  console.log(
    `[migrations] VERCEL_ENV="${process.env.VERCEL_ENV ?? 'unknown'}". Pulando migrate deploy em Preview para proteger o banco de Produção.`,
  );
  process.exit(0);
}

console.log('[migrations] Executando prisma migrate deploy...');
try {
  execSync('npx prisma migrate deploy', {
    cwd: nestApiDir,
    stdio: 'inherit',
    env: process.env,
  });
  console.log('[migrations] Migrações aplicadas com sucesso!');
} catch (error) {
  console.error('[migrations] ERRO CRÍTICO ao rodar prisma migrate deploy:', error.message);
  process.exit(1);
}
