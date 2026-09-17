import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const repoRoot = process.cwd();
const requireFromRoot = createRequire(import.meta.url);

const readJson = (relativePath) => {
  const absolutePath = path.join(repoRoot, relativePath);
  return JSON.parse(readFileSync(absolutePath, 'utf8'));
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(`Vercel packaging check failed: ${message}`);
  }
};

const config = readJson('vercel.json');
const rootFunction = config.functions?.['api/index.js'];
const wildcardFunction = config.functions?.['api/[...path].js'];
const routeSources = (config.routes ?? []).map((route) => route.src).filter(Boolean);

assert(config.buildCommand === 'npm run build:vercel', 'root buildCommand must use build:vercel');
assert(config.outputDirectory === 'app-admin/dist', 'Admin outputDirectory is not configured');
assert(rootFunction && wildcardFunction, 'both API adapters must have function configuration');
assert(
  JSON.stringify(rootFunction.includeFiles) === JSON.stringify(wildcardFunction.includeFiles),
  'API adapters must use the same includeFiles configuration'
);
for (const requiredPath of [
  'nest-api/dist/**',
  'nest-api/prisma/**',
  'node_modules/.prisma/client/**',
  'node_modules/@prisma/client/**',
]) {
  assert(rootFunction.includeFiles.includes(requiredPath), `missing includeFiles entry: ${requiredPath}`);
}
assert(routeSources[0] === '/api/(.*)', 'API route must precede filesystem handling');
assert(config.routes.some((route) => route.handle === 'filesystem'), 'filesystem route is missing');
assert(routeSources.includes('/admin(?:/.*)?'), 'Admin deep-link fallback is missing');
assert(routeSources.includes('/'), 'root SPA fallback is missing');
assert(!routeSources.includes('/(.*)'), 'broad SPA fallback must not capture API failures');

const distServerless = path.join(repoRoot, 'nest-api', 'dist', 'serverless.js');
const adminIndex = path.join(repoRoot, 'app-admin', 'dist', 'index.html');
assert(existsSync(distServerless), 'nest-api/dist/serverless.js is missing; run build:vercel first');
assert(existsSync(adminIndex), 'app-admin/dist/index.html is missing; run build:vercel first');

const rootAdapter = requireFromRoot(path.join(repoRoot, 'api', 'index.js'));
const wildcardAdapter = requireFromRoot(path.join(repoRoot, 'api', '[...path].js'));
assert(typeof rootAdapter === 'function', 'api/index.js must export a handler');
assert(typeof wildcardAdapter === 'function', 'api/[...path].js must export a handler');

console.log('Vercel packaging check passed: build outputs, adapters, function assets, and route ordering are valid.');
