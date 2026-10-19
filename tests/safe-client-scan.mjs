// Compare known secrets in memory; output only artifact paths/key names, never values.
import assert from 'node:assert/strict';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
const database = new URL(process.env.DATABASE_URL || 'http://missing');
assert.equal(database.hostname, '127.0.0.1'); assert.equal(database.port, '55432'); assert.equal(database.pathname, '/tiladys_rebuild_test');
const fixture = JSON.parse(await readFile('/tmp/tiladys-rebuild/browser-fixtures.json', 'utf8'));
const secrets = new Map([
  ['synthetic database password', decodeURIComponent(database.password)],
  ['synthetic browser session', fixture.token], ['synthetic admin password', fixture.password], ['synthetic secret phrase', fixture.secretWord],
]);
for (const filename of ['apps/control/.env.local', 'apps/control/.env.recovery.local']) {
  const contents = await readFile(filename, 'utf8').catch(() => '');
  for (const line of contents.split('\n')) {
    const match = line.match(/^([A-Z_]*(?:SECRET|TOKEN|PASSWORD|DATABASE_URL)[A-Z_]*)=(.*)$/);
    if (!match) continue;
    const value = match[2].trim().replace(/^(['"])(.*)\1$/, '$2');
    if (value.length >= 12) secrets.set(`${filename}: ${match[1]}`, value);
  }
}
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? files(join(directory, entry.name)) : /\.(?:js|css|json|map|html)$/.test(entry.name) ? [join(directory, entry.name)] : []))).flat();
}
const artifacts = (await Promise.all(['apps/web/.next/static', 'apps/web/.next/dev/static', 'apps/control/.next/static'].map(files))).flat();
assert.ok(artifacts.length > 0, 'Build artifacts required');
const leaks = [];
for (const artifact of artifacts) {
  const contents = await readFile(artifact, 'utf8');
  for (const [key, value] of secrets) if (value?.length >= 12 && contents.includes(value)) leaks.push({ artifact, key });
}
await writeFile('docs/safe-execution/evidence/client-secret-scan.json', JSON.stringify({ timestamp: new Date().toISOString(), artifacts: artifacts.length, knownValues: secrets.size, leaks, scope: 'Exact known synthetic credentials/database password and selected existing server env values in built client artifacts; not a universal secret/PII scan.' }, null, 2));
assert.deepEqual(leaks, []);
console.log(`PASS ${artifacts.length} client artifacts; no exact known secret values found.`);
