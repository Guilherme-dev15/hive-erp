#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const trackedFiles = execFileSync('git', ['ls-files', '-z'], {
  cwd: repoRoot,
  encoding: 'utf8',
}).split('\0').filter(Boolean);

const ignoredExample = (file) => path.basename(file) === '.env.example';
const findings = [];

const highConfidencePatterns = [
  { name: 'private key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'Stripe secret', pattern: /(?:sk|rk)_(?:live|test)_[A-Za-z0-9]+/ },
  { name: 'Stripe webhook secret', pattern: /whsec_[A-Za-z0-9]+/ },
  { name: 'GitHub token', pattern: /(?:gh[pousr]|github_pat)_[A-Za-z0-9_]+/ },
  { name: 'AWS access key', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Slack token', pattern: /xox[baprs]-[0-9A-Za-z-]+/ },
];

for (const file of trackedFiles) {
  if (ignoredExample(file)) continue;

  const basename = path.basename(file);
  if (basename === '.env' || /^\.env\.(?:local|development|test|production)(?:\.local)?$/.test(basename)) {
    findings.push({ file, detail: 'tracked environment file' });
    continue;
  }

  let content;
  try {
    content = readFileSync(path.join(repoRoot, file), 'utf8');
  } catch {
    continue;
  }

  for (const { name, pattern } of highConfidencePatterns) {
    if (pattern.test(content)) findings.push({ file, detail: name });
  }
}

if (findings.length > 0) {
  console.error('Secret scan failed: high-confidence findings detected (values redacted).');
  for (const { file, detail } of findings) {
    console.error(`- ${file}: ${detail}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Secret scan passed: ${trackedFiles.length} tracked files checked (values redacted).`);
}
