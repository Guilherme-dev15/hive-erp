import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nestApiDir = path.resolve(__dirname, '../nest-api');

if (process.env.DATABASE_URL) {
  console.log('[migrations] DATABASE_URL detectada. Executando prisma migrate deploy...');
  try {
    execSync('npx prisma migrate deploy', {
      cwd: nestApiDir,
      stdio: 'inherit',
      env: process.env,
    });
    console.log('[migrations] Migrações aplicadas com sucesso!');
  } catch (error) {
    console.error('[migrations] Aviso: falha ao rodar migrate deploy:', error.message);
  }
} else {
  console.log('[migrations] DATABASE_URL não definida no ambiente de build. Pulando migrate deploy.');
}
