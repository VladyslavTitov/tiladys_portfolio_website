import { spawnSync } from 'node:child_process';
const result = spawnSync('npm', ['--prefix', '../..', 'run', 'db:generate'], { stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status || 1);
// Vercel builds must fail closed, including previews. Local builds can opt in.
if (process.env.VERCEL === '1' || process.env.RELEASE_SCHEMA_CHECK === '1') {
  const check = spawnSync('node', ['../../scripts/check-crm-schema.mjs'], { stdio: 'inherit' });
  process.exit(check.status || (check.error ? 1 : 0));
}
