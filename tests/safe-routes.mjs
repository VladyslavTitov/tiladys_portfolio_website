import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const base = 'http://127.0.0.1:3100';
const checks = [];
for (const locale of ['en', 'de', 'uk', 'ru', 'sk', 'fr']) {
  const response = await fetch(`${base}/${locale}/services/3d-printing`);
  assert.equal(response.status, 200); const html = await response.text();
  assert.ok(html.includes(`<html lang="${locale}"`));
  assert.match(html, new RegExp(`rel="canonical"[^>]+href="[^"]+/${locale}/services/3d-printing"`));
  assert.match(html, /hrefLang="uk"/i); assert.doesNotMatch(html, /hrefLang="ua"/i);
  checks.push(`200, correct HTML language, canonical and Ukrainian hreflang: ${locale}`);
}
for (const [path, destination] of [['/de/prices', '/de/services'], ['/de/services/it-support-diagnostics', '/de/services/pc-laptop']]) {
  const response = await fetch(base + path, { redirect: 'manual' });
  assert.equal(response.status, 308); assert.ok(response.headers.get('location')?.endsWith(destination));
  checks.push(`Legacy redirect: ${path}`);
}
const root = await fetch(base, { headers: { 'accept-language': 'de-DE' }, redirect: 'manual' });
assert.equal(root.status, 307); assert.equal(new URL(root.headers.get('location'), base).pathname.replace(/\/$/, ''), '/de');
assert.equal((await fetch(base + '/de/synthetic-missing-route')).status, 404);
checks.push('Language-aware root redirect and real missing-page 404.');
const sitemap = await fetch(base + '/sitemap.xml'); assert.equal(sitemap.status, 200);
assert.doesNotMatch(await sitemap.text(), /\/dashboard|\/api\//);
checks.push('Public sitemap excludes dashboard and API paths.');
await writeFile('docs/safe-execution/evidence/routes.json', JSON.stringify({ timestamp: new Date().toISOString(), checks }, null, 2));
console.log(JSON.stringify({ passed: checks.length, checks }));
