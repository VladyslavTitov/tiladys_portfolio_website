// Local production-build checks with synthetic control API data. No database or SMTP.
// Run `npm run build` first. Requires Chrome and Node 22; no browser dependency installed.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

const web = 'http://127.0.0.1:3100';
const control = 'http://127.0.0.1:3101';
const api = 'http://127.0.0.1:3199';
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
const locales = ['en', 'de', 'uk', 'ru', 'sk', 'fr'];
const projects = ['alpha', 'beta', 'gamma', 'draft', 'archived'].map((slug, index) => ({
  id: slug, slug, status: index < 3 ? 'PUBLISHED' : slug.toUpperCase(), category: index === 2 ? 'web-development' : 'pc-support',
  title: Object.fromEntries(locales.map((locale) => [locale, `${locale} Project ${slug}`])),
  summary: Object.fromEntries(locales.map((locale) => [locale, `${locale} Synthetic portfolio summary for ${slug}`])),
  seoTitle: { de: `Suche ${slug}` }, seoDescription: { de: `Suchbeschreibung ${slug}` },
  socialTitle: { de: `Teilen ${slug}` }, socialDescription: { de: `Vorschau ${slug}` }, socialImageId: `${slug}-preview`,
  images: [
    { id: `${slug}-cover`, url: `${web}/services/tiladys-service-website-creation.png`, sortOrder: 0 },
    { id: `${slug}-preview`, url: `${web}/about/vladyslav-titov.jpeg`, sortOrder: 1 },
  ],
}));
const priceData = await readFile('packages/db/prisma/price-data.json', 'utf8');
let visible = projects;
let listFailure = false;
let listDelay = 0;
const fixture = createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  if (req.url === '/api/public/prices') return res.end(priceData);
  if (req.url === '/api/public/projects') return setTimeout(() => {
    if (listFailure) { res.statusCode = 500; res.end(JSON.stringify({ error: 'Synthetic upstream error' })); }
    else res.end(JSON.stringify(visible.filter((project) => project.status === 'PUBLISHED')));
  }, listDelay);
  const slug = decodeURIComponent(req.url.split('/').pop());
  const project = visible.find((project) => project.status === 'PUBLISHED' && (project.slug === slug || `old-${project.slug}` === slug));
  if (project) return res.end(JSON.stringify(project));
  res.statusCode = 404; res.end('{}');
});
const children = [];
const profile = await mkdtemp(join(tmpdir(), 'tiladys-browser-'));
let connection;
function launch(command, args, options = {}) {
  const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], ...options });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { output += chunk; });
  child.on('error', (error) => { output += error.message; });
  child.debugOutput = () => output.slice(-4000);
  children.push(child);
  return child;
}
async function until(check, label, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { if (await check()) return; } catch {}
    await sleep(100);
  }
  throw new Error(`Timed out: ${label}`);
}
class CDP {
  constructor(url) {
    this.socket = new WebSocket(url); this.next = 0; this.pending = new Map(); this.errors = [];
    this.ready = new Promise((resolve, reject) => { this.socket.addEventListener('open', resolve); this.socket.addEventListener('error', reject); });
    this.socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data);
      if (message.method === 'Runtime.exceptionThrown') this.errors.push(message.params.exceptionDetails.text);
      if (message.id) { const request = this.pending.get(message.id); this.pending.delete(message.id); if (message.error) request.reject(message.error); else request.resolve(message.result); }
    });
  }
  async send(method, params = {}) {
    await this.ready;
    return new Promise((resolve, reject) => { const id = ++this.next; this.pending.set(id, { resolve, reject }); this.socket.send(JSON.stringify({ id, method, params })); });
  }
  async evaluate(expression) {
    const output = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (output.exceptionDetails) throw new Error(JSON.stringify(output.exceptionDetails));
    return output.result.value;
  }
  async navigate(url) {
    await this.send('Page.navigate', { url });
    await until(() => this.evaluate(`location.href === ${JSON.stringify(url)} && document.readyState === 'complete'`), url);
    await sleep(300);
  }
}
try {
  await new Promise((done) => fixture.listen(3199, '127.0.0.1', done));
  const env = { PATH: process.env.PATH, HOME: process.env.HOME, NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://synthetic:synthetic@127.0.0.1:1/no_database?connect_timeout=1',
    CONTROL_API_URL: api, CONTROL_URL: control, SITE_URL: web, AUTH_SECRET: 'synthetic-browser-check-not-a-real-secret',
    CONTACT_RATE_LIMIT_SECRET: 'synthetic-contact-test', SMTP_HOST: '', SMTP_FROM: '', NEXT_TELEMETRY_DISABLED: '1',
  };
  const next = resolve('node_modules/next/dist/bin/next');
  launch(process.execPath, [next, 'start', '-p', '3100', '-H', '127.0.0.1'], { cwd: resolve('apps/web'), env });
  launch(process.execPath, [next, 'start', '-p', '3101', '-H', '127.0.0.1'], { cwd: resolve('apps/control'), env });
  launch(process.env.CHROME_BIN || 'google-chrome', ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking', '--no-first-run', '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=9334', `--user-data-dir=${profile}`, 'about:blank']);
  await until(async () => (await fetch(`${control}/login`)).ok && (await fetch(`${web}/en/portfolio`)).ok, 'local apps');
  await until(async () => (await fetch('http://127.0.0.1:9334/json')).ok, 'Chrome');
  const targets = await (await fetch('http://127.0.0.1:9334/json')).json();
  connection = new CDP(targets.find((target) => target.type === 'page').webSocketDebuggerUrl);
  await connection.send('Page.enable'); await connection.send('Runtime.enable');
  await connection.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await connection.navigate(`${web}/en/portfolio`);
  assert.equal(await connection.evaluate(`document.querySelectorAll('.portfolio-card').length`), 3);
  assert.deepEqual(await connection.evaluate(`[...document.querySelectorAll('.portfolio-card h2')].map(e=>e.textContent)`), projects.slice(0, 3).map((project) => project.title.en));
  const initial = await connection.evaluate(`document.querySelector('.featured-project h2').textContent`);
  await connection.evaluate(`document.querySelectorAll('.featured-controls button')[1].click()`);
  await until(() => connection.evaluate(`document.querySelector('.featured-project h2').textContent !== ${JSON.stringify(initial)}`), 'next carousel control');
  assert.equal(await connection.evaluate(`document.querySelectorAll('.portfolio-card').length`), 3);
  await connection.evaluate(`document.querySelectorAll('.featured-controls button')[0].click()`);
  await until(() => connection.evaluate(`document.querySelector('.featured-project h2').textContent === ${JSON.stringify(initial)}`), 'previous carousel control');
  // Native button keyboard operation: Enter advances the focused Next button.
  await connection.evaluate(`document.querySelectorAll('.featured-controls button')[1].focus()`);
  await connection.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', windowsVirtualKeyCode: 13 });
  await connection.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await until(() => connection.evaluate(`document.querySelector('.featured-project h2').textContent === 'en Project beta'`), 'keyboard carousel next');
  await connection.evaluate(`document.activeElement.blur()`);
  await connection.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
  await until(() => connection.evaluate(`document.querySelector('.featured-project h2').textContent === 'en Project gamma'`), '15-second automatic rotation', 18000);
  await connection.evaluate(`document.querySelectorAll('.featured-controls button')[2].click()`);
  assert.equal(await connection.evaluate(`document.querySelectorAll('.featured-controls button')[2].getAttribute('aria-pressed')`), 'true');
  const paused = await connection.evaluate(`document.querySelector('.featured-project h2').textContent`);
  await sleep(15500);
  assert.equal(await connection.evaluate(`document.querySelector('.featured-project h2').textContent`), paused);
  await connection.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await until(() => connection.evaluate(`document.querySelectorAll('.featured-controls button').length === 2`), 'reduced-motion controls');
  console.log('PASS: all published fixtures remain in grid during navigation, keyboard/15-second rotation, pause and reduced motion.');
  for (const locale of locales) {
    await connection.navigate(`${web}/${locale}/portfolio/alpha`);
    const metadata = await connection.evaluate(`({lang: document.documentElement.lang, title: document.title, canonical: document.querySelector('link[rel=canonical]').href, alternates: [...document.querySelectorAll('link[hreflang]')].map(e=>e.hreflang), social: document.querySelector('meta[property="og:image"]').content, twitter: document.querySelector('meta[name="twitter:card"]').content, heading: document.querySelector('h1').textContent})`);
    assert.equal(metadata.lang, locale); assert.equal(metadata.heading, `${locale} Project alpha`);
    assert.ok(metadata.canonical.endsWith(`/${locale}/portfolio/alpha`));
    assert.deepEqual(metadata.alternates.sort(), [...locales, 'x-default'].sort());
    assert.equal(metadata.social, `${web}/about/vladyslav-titov.jpeg`);
    assert.equal(metadata.twitter, 'summary_large_image');
    if (locale === 'de') assert.match(metadata.title, /Suche alpha/);
  }
  const redirect = await fetch(`${web}/de/portfolio/old-alpha`, { redirect: 'manual' });
  assert.equal(redirect.status, 308); assert.equal(redirect.headers.get('location'), '/de/portfolio/alpha');
  for (const slug of ['draft', 'archived', 'old-draft', 'old-archived']) {
    const response = await fetch(`${web}/en/portfolio/${slug}`);
    assert.equal(response.status, 404);
    assert.match(await response.text(), /noindex/);
  }
  const sitemap = await (await fetch(`${web}/sitemap.xml`)).text();
  for (const locale of locales) {
    for (const project of projects.slice(0, 3)) assert.ok(sitemap.includes(`/${locale}/portfolio/${project.slug}`));
    for (const service of ['pc-laptop', 'websites', 'business-it']) assert.ok(sitemap.includes(`/${locale}/services/${service}`));
  }
  assert.doesNotMatch(sitemap, /portfolio\/(draft|archived|old-alpha)/);
  console.log('PASS: six localized project metadata sets, canonical/hreflang/social image, 308 aliases, private 404/noindex and sitemap inclusion/exclusion.');
  await connection.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  for (const locale of ['en', 'de']) {
    await connection.navigate(`${web}/${locale}/services/pc-laptop`);
    const area = await connection.evaluate(`document.querySelector('[aria-labelledby="pc-service-area"]').textContent`);
    for (const city of ['Mülheim an der Ruhr', 'Düsseldorf', 'Dortmund', 'Duisburg', 'Oberhausen', 'Wuppertal', 'Essen']) assert.ok(area.includes(city));
    assert.ok(await connection.evaluate(`JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)[0].areaServed.some(e=>e.name === 'Nordrhein-Westfalen')`));
    assert.ok(await connection.evaluate(`document.documentElement.scrollWidth <= innerWidth`));
  }
  await connection.navigate(`${web}/de/services/websites`);
  assert.equal(await connection.evaluate(`'areaServed' in JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)[0]`), false);
  await connection.navigate(`${web}/de/about`);
  assert.equal(await connection.evaluate(`JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent).founder.name`), 'Vladyslav Titov');
  await connection.navigate(`${web}/de/portfolio`);
  assert.ok(await connection.evaluate(`document.documentElement.scrollWidth <= innerWidth`));
  visible = [projects[0]];
  await connection.navigate(`${web}/en/portfolio`);
  assert.equal(await connection.evaluate(`document.querySelectorAll('.portfolio-card').length`), 1);
  assert.equal(await connection.evaluate(`document.querySelectorAll('.featured-controls button').length`), 0);
  visible = [];
  await connection.navigate(`${web}/de/portfolio`);
  assert.equal(await connection.evaluate(`document.querySelectorAll('.featured-project').length`), 0);
  assert.equal(await connection.evaluate(`document.querySelectorAll('.empty-state').length`), 1);
  console.log('PASS: mobile EN/DE service areas, remote web-service scope, founder, portfolio, zero/one-project static states.');
  listFailure = true;
  await connection.navigate(`${web}/de/portfolio`);
  assert.equal(await connection.evaluate(`document.querySelectorAll('.portfolio-error[role=alert]').length`), 1);
  assert.equal(await connection.evaluate(`document.querySelectorAll('.empty-state').length`), 0);
  assert.match(await connection.evaluate(`document.querySelector('.portfolio-error').textContent`), /vorübergehend/);
  assert.doesNotMatch(await connection.evaluate(`document.querySelector('.portfolio-error').textContent`), /Synthetic upstream|Prisma|P2022/);
  listFailure = false;
  visible = projects;
  await connection.evaluate(`document.querySelector('.portfolio-error a').click()`);
  await until(() => connection.evaluate(`document.querySelectorAll('.portfolio-card').length === 3`), 'retry recovers projects');
  listDelay = 3000;
  await connection.send('Page.navigate', { url: `${web}/en/portfolio` });
  await until(() => connection.evaluate(`Boolean(document.querySelector('[role=status][aria-busy=true]'))`), 'portfolio loading state');
  assert.match(await connection.evaluate(`document.querySelector('[role=status]').textContent`), /Loading projects/);
  await until(() => connection.evaluate(`document.querySelectorAll('.portfolio-card').length === 3`), 'loading resolves');
  listDelay = 0;
  console.log('PASS: API 500 shows localized error, not empty state; retry recovers; slow API shows accessible loading state.');

  for (const width of [390, 1440]) {
    await connection.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 500 });
    await connection.navigate(`${control}/login`);
    const login = await connection.evaluate(`({outside: !document.querySelector('form').contains(document.querySelector('.login-brand img')), above: document.querySelector('.login-brand').getBoundingClientRect().bottom <= document.querySelector('form').getBoundingClientRect().top, loaded: document.querySelector('.login-brand img').naturalWidth > 0, inputs: [...document.querySelectorAll('input')].map(e=>({name:e.name,value:e.value})), fits: document.documentElement.scrollWidth <= innerWidth})`);
    assert.ok(login.outside && login.above && login.loaded && login.fits);
    assert.deepEqual(login.inputs, ['email', 'password', 'secretWord'].map((name) => ({ name, value: '' })));
    await connection.send('Page.captureScreenshot', { format: 'png' }).then(async ({ data }) => {
      const { writeFile } = await import('node:fs/promises');
      await writeFile(`/tmp/tiladys-phase1-login-${width}.png`, Buffer.from(data, 'base64'));
    });
  }
  const unauthorized = await fetch(`${control}/api/admin/projects`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: control }, body: '{}' });
  assert.equal(unauthorized.status, 401);
  assert.equal((await fetch(`${control}/dashboard/projects`, { redirect: 'manual' })).status, 307);
  assert.equal(connection.errors.length, 0, connection.errors.join('\n'));
  console.log('PASS: mobile/desktop navy logo outside card, no prefilled credentials, admin auth guards, no browser exceptions.');
} catch (error) {
  for (const child of children) console.error(child.debugOutput());
  throw error;
} finally {
  connection?.socket.close();
  for (const child of children) child.kill('SIGTERM');
  fixture.close();
  await sleep(500);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
