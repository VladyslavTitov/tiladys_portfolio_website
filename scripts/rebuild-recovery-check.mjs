import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cp, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const url = new URL(process.env.DATABASE_URL || 'http://missing');
assert.ok(url.hostname === '127.0.0.1' && url.port === '55432' && url.pathname === '/tiladys_rebuild_test', 'ISOLATED_SYNTHETIC_DATABASE_REQUIRED');
assert.equal(process.env.REBUILD_WRITERS_STOPPED, 'true', 'Stop owned synthetic app/worker processes before the matched backup');
const container = 'tiladys-rebuild-dev-20261013';
const docker = (args, input) => execFileSync('docker', args, { input, maxBuffer: 256 * 1024 * 1024 });
const purpose = docker(['inspect', '--format', '{{index .Config.Labels "purpose"}}', container]).toString().trim();
assert.equal(purpose, 'tiladys-isolated-synthetic-tests');
const source = 'tiladys_rebuild_test';
const stamp = new Date().toISOString().replace(/[^0-9]/g, '');
const restored = `tiladys_rebuild_restore_${stamp}`;
const directory = `/tmp/tiladys-recovery-${stamp}`;
await mkdir(directory, { mode: 0o700 });
const sql = (database, query) => docker(['exec', '-i', container, 'psql', '-X', '-U', 'tiladys_test', '-d', database, '-At', '-v', 'ON_ERROR_STOP=1'], query).toString().trim();
const dump = docker(['exec', container, 'pg_dump', '-U', 'tiladys_test', '-d', source, '-Fc']);
await writeFile(join(directory, 'database.dump'), dump, { mode: 0o600 });

async function manifest(root, prefix = '') {
  const output = [];
  for (const item of await readdir(join(root, prefix), { withFileTypes: true })) {
    assert.ok(!item.isSymbolicLink(), 'Synthetic backup must not follow symlinks');
    const relative = join(prefix, item.name);
    if (item.isDirectory()) output.push(...await manifest(root, relative));
    else if (item.isFile()) {
      const bytes = await readFile(join(root, relative));
      output.push({ path: relative, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
    }
  }
  return output.sort((a, b) => a.path.localeCompare(b.path));
}
const objects = [];
for (const name of ['tiladys-upload-test', 'tiladys-browser-photos']) {
  const original = `/tmp/${name}`;
  assert.ok((await stat(original)).isDirectory());
  const backup = join(directory, name);
  await cp(original, backup, { recursive: true, force: false, errorOnExist: true });
  const target = join(directory, 'restored-objects', name);
  await cp(backup, target, { recursive: true, force: false, errorOnExist: true });
  const before = await manifest(original);
  const after = await manifest(target);
  assert.deepEqual(after, before, 'Restored object paths and exact bytes must match');
  objects.push({ root: name, fileCount: before.length, bytes: before.reduce((n, f) => n + f.bytes, 0), byteHashesEqual: true });
}
docker(['exec', container, 'createdb', '-U', 'tiladys_test', restored]);
docker(['exec', '-i', container, 'pg_restore', '-U', 'tiladys_test', '-d', restored, '--exit-on-error', '--no-owner', '--no-privileges'], dump);
const names = sql(source, "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename").split('\n');
const quote = value => '"' + value.replaceAll('"', '""') + '"';
const tables = [];
for (const name of names) {
  const query = `SELECT json_build_object('rows',count(*),'fingerprint',md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'' ORDER BY md5(to_jsonb(t)::text)),''))) FROM public.${quote(name)} t`;
  const before = JSON.parse(sql(source, query));
  const after = JSON.parse(sql(restored, query));
  assert.deepEqual(after, before, `Restored table ${name} differs`);
  tables.push({ table: name, rows: before.rows, exactRowFingerprintsEqual: true });
}
const indexes = "SELECT indexname || ':' || indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY indexname";
assert.equal(sql(restored, indexes), sql(source, indexes), 'All indexes, including partial constraints, must survive');
const references = JSON.parse(sql(source, `SELECT COALESCE(json_agg("storageKey"),'[]') FROM "MediaObject" WHERE accepted=true`));
const restoredObjects = (await Promise.all(['tiladys-upload-test', 'tiladys-browser-photos'].map(name => manifest(join(directory, 'restored-objects', name))))).flat();
assert.ok(references.every(key => restoredObjects.some(file => file.path === key)), 'Every accepted synthetic media key must have matching restored bytes');
const evidence = {
  timestamp: new Date().toISOString(), environment: 'isolated synthetic localhost PostgreSQL 17',
  sourceDatabase: source, restoredDatabase: restored, backupDirectory: directory,
  sourceOverwritten: false, tableCount: tables.length, tables, indexesEqual: true, objects,
  acceptedMediaReferences: references.length, acceptedMediaReferencesRestored: true,
  objectHashMethod: 'SHA-256 of actual source/restored bytes, independent of historical metadata checksum format',
  databaseBackupSha256: createHash('sha256').update(dump).digest('hex'),
  productionBackupVerified: false,
};
await writeFile('docs/tiladys-rebuild/implementation/evidence/recovery-final.json', JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify({ tables: tables.length, allTableFingerprintsEqual: true, indexesEqual: true, objects, acceptedMediaReferences: references.length, productionBackupVerified: false }, null, 2));
