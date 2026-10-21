// Read-only browser checks against the explicitly bound local synthetic apps.
// Run after a production build/start: node tests/safe-layouts.mjs baseline|after
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const phase = process.argv[2];
assert.ok(['baseline', 'after'].includes(phase));
const control = process.argv[3] === 'control';
const publicPort = process.env.PUBLIC_TEST_PORT || '3100';
assert.ok(['3100', '3110'].includes(publicPort), 'Only guarded local test previews are supported');
const base = control ? 'http://127.0.0.1:3101' : `http://127.0.0.1:${publicPort}`;
const stage = process.env.LAYOUT_STAGE || phase;
assert.match(stage, /^[a-z0-9-]+$/);
const directory = `docs/safe-execution/evidence/${stage}${control ? '-control' : ''}${process.env.LAYOUT_WIDTHS ? '-focused' : ''}`;
await mkdir(directory, { recursive: true });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(check, label, timeout = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { if (await check()) return; } catch { /* wait for browser/server */ }
    await sleep(100);
  }
  throw Error(`Timeout: ${label}`);
}
class CDP {
  pending = new Map(); next = 0; errors = []; loaded = new Set();
  constructor(url) {
    this.socket = new WebSocket(url);
    this.ready = new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve);
      this.socket.addEventListener('error', reject);
    });
    this.socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data);
      if (message.method === 'Page.lifecycleEvent' && message.params.name === 'load') this.loaded.add(message.params.loaderId);
      if (message.method === 'Runtime.exceptionThrown') this.errors.push(message.params.exceptionDetails.text);
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      this.pending.delete(message.id);
      message.error ? pending.reject(message.error) : pending.resolve(message.result);
    });
    this.socket.addEventListener('close', () => {
      for (const pending of this.pending.values()) pending.reject(Error('Browser connection closed'));
      this.pending.clear();
    });
  }
  async send(method, params = {}) {
    await this.ready;
    return new Promise((resolve, reject) => {
      const id = ++this.next;
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  async navigate(url) {
    const navigation = await this.send('Page.navigate', { url });
    if (navigation.errorText) throw Error(navigation.errorText);
    if (navigation.loaderId) await until(() => this.loaded.has(navigation.loaderId), `Document loaded: ${url}`);
    await until(() => this.evaluate(`location.href === ${JSON.stringify(url)} && document.readyState === 'complete' && [...document.querySelectorAll('h1')].some(e=>e.getBoundingClientRect().width>0 && !e.closest('[hidden]'))`), url);
    await sleep(250);
  }
}
const profile = await mkdtemp(join(tmpdir(), 'tiladys-safe-chrome-'));
const debugPort = control ? 9339 : 9338;
const chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking', '--no-first-run', '--remote-debugging-address=127.0.0.1', `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
const rows = [], performance = [], failures = [], accessibility = [], interactions = [];
const axeSource = process.env.ACCESSIBILITY === '1' ? await readFile(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8') : null;
let c;
try {
  await until(async () => (await fetch(`http://127.0.0.1:${debugPort}/json`)).ok, 'Chrome');
  const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json();
  c = new CDP(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
  await c.send('Page.enable'); await c.send('Page.setLifecycleEventsEnabled', { enabled: true }); await c.send('Runtime.enable'); await c.send('Network.enable');
  await c.send('Accessibility.enable');
  await c.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (control) {
    const fixture = JSON.parse(await readFile('/tmp/tiladys-rebuild/browser-fixtures.json', 'utf8'));
    await c.send('Network.setCookie', { name: 'tiladys_session', value: fixture.token, url: base, httpOnly: true, sameSite: 'Strict' });
    await c.send('Network.setCookie', { name: 'control_locale', value: 'de', url: base, sameSite: 'Strict' });
  }
  await c.send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__lab={lcp:0,cls:0};new PerformanceObserver(list=>{for(const e of list.getEntries())window.__lab.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__lab.cls+=e.value}).observe({type:'layout-shift',buffered:true});` });
  const routes = control ? ['', '/messages', '/customers', '/companies', '/service-jobs', '/quotes', '/invoices', '/projects', '/products', '/tasks', '/prices', '/settings'] : ['', '/services', '/services/websites', '/services/pc-laptop', '/services/3d-printing', '/portfolio', '/about', '/contact', '/products/framer', '/products/3d-models', '/privacy'];
  const widths = process.env.PERFORMANCE_ONLY === '1' ? [] : process.env.LAYOUT_WIDTHS ? process.env.LAYOUT_WIDTHS.split(',').map(Number) : [320, 360, 390, 768, 1024, 1280, 1440, 1920, 2560];
  for (const width of widths) {
    await c.send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 768 });
    for (const route of process.env.LAYOUT_ROUTES ? process.env.LAYOUT_ROUTES.split(',') : routes) {
      await c.navigate(`${base}/${control ? 'dashboard' : 'de'}${route}`);
      const layout = await c.evaluate(`({width:innerWidth,scroll:document.documentElement.scrollWidth,h1:document.querySelector('h1')?.textContent,footer:document.querySelectorAll('.site-footer__grid>section').length,sections:[...document.querySelectorAll('main .section')].map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{class:e.className,x:r.x,width:r.width,content:r.width-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight)}}),cards:[...document.querySelectorAll('.rebuild-services .rebuild-card')].map(e=>e.getBoundingClientRect().width),unlabelled:[...document.querySelectorAll('input:not([type=hidden]):not(.trap),select,textarea')].filter(e=>!e.labels?.length&&!e.getAttribute('aria-label')).map(e=>e.name)})`);
      layout.viewport = await c.evaluate('document.documentElement.clientWidth');
      if (layout.scroll > width + 1) layout.overflow = await c.evaluate(`[...document.querySelectorAll('main *')].filter(e=>e.getBoundingClientRect().right>document.documentElement.clientWidth+1 || e.scrollWidth>e.clientWidth+1).slice(0,30).map(e=>({tag:e.tagName,class:e.className,right:e.getBoundingClientRect().right,scroll:e.scrollWidth,client:e.clientWidth,text:e.textContent.slice(0,60)}))`);
      rows.push({ route, requestedWidth: width, ...layout });
      if (axeSource) {
        await c.evaluate(axeSource + '\n;true');
        const violations = await c.evaluate(`axe.run(document, {runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}).then(r=>r.violations.map(v=>({id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})))`);
        accessibility.push({ route, width, violations });
        if (violations.length) failures.push(`Accessibility: ${route || '/'} ${width}: ${violations.map(v=>v.id).join(',')}`);
      }
      if (layout.scroll > width + 1) failures.push(`Overflow: ${route || '/'} ${width}: ${layout.scroll}`);
      if (!layout.h1 || (!control && layout.footer !== 5) || layout.unlabelled.length) failures.push(`Semantics: ${route || '/'} ${width}: ${layout.unlabelled.join(',')}`);
      if (width >= 1280 && layout.cards.some(card => card < 300)) failures.push(`Narrow service card: ${route || '/'} ${width}: ${layout.cards.join(',')}`);
      for (const section of layout.sections) {
        if (section.content < 200) failures.push(`Collapsed section: ${route || '/'} ${width} ${section.class}: ${section.content}`);
        if (width >= 1280 && section.width >= 1000 && Math.abs(section.x - (layout.viewport - section.width) / 2) > 2) failures.push(`Uncentred section: ${route || '/'} ${width} ${section.class}`);
      }
      if ((control ? ['', '/service-jobs', '/invoices'] : ['', '/services/websites', '/contact', '/about']).includes(route) && [390, 1440, 2560].includes(width)) {
        if (process.env.FULL_SCREENSHOTS === '1') {
          await c.evaluate(`Promise.all([...document.images].map(img=>{img.loading='eager';return img.decode().catch(()=>{})}))`);
          await sleep(150);
        }
        const capture = await c.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: process.env.FULL_SCREENSHOTS === '1' });
        await writeFile(`${directory}/${route.replaceAll('/', '-') || 'home'}-${width}.png`, Buffer.from(capture.data, 'base64'));
      }
    }
    console.log(`Checked ${control ? 'Control' : 'public'} width ${width}`);
  }
  if (process.env.PERFORMANCE_ONLY !== '1' && !process.env.LAYOUT_ROUTES) {
    await c.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await c.navigate(`${base}/${control ? 'dashboard' : 'de'}`);
    const selector = control ? '.control-menu' : '.mobile-menu-button';
    await until(() => c.evaluate(`Object.keys(document.querySelector(${JSON.stringify(selector)})).some(k=>k.startsWith('__reactFiber'))`), 'Menu hydration');
    await c.evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
    await until(() => c.evaluate(`document.querySelector(${JSON.stringify(selector)}).getAttribute('aria-expanded')==='true'`), 'Menu opens');
    if (!control) {
      const aligned = await c.evaluate(`Math.abs(document.querySelector('.site-header').getBoundingClientRect().bottom-document.querySelector('.site-nav').getBoundingClientRect().top)<3`);
      if (!aligned) failures.push('Mobile menu does not start under the header');
    }
    await c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await until(() => c.evaluate(`document.activeElement===document.querySelector(${JSON.stringify(selector)}) && document.activeElement.getAttribute('aria-expanded')==='false'`), 'Menu Escape/focus restoration');
    interactions.push('Mobile menu opens; native Escape closes it and restores trigger focus');
    await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    const reduced = await c.evaluate(`matchMedia('(prefers-reduced-motion: reduce)').matches && getComputedStyle(document.documentElement).scrollBehavior!=='smooth'`);
    if (!reduced) failures.push('Reduced-motion scrolling');
    interactions.push('Reduced-motion scrolling verified');
  }
  // Three cold-cache production samples using identical transport/CPU conditions.
  for (const variant of control || process.env.LAYOUT_WIDTHS || axeSource ? [] : [{ name: 'mobile-4g', width: 390, mobile: true, cpu: 4 }, { name: 'desktop', width: 1440, mobile: false, cpu: 1 }, { name: 'wide-desktop', width: 2560, mobile: false, cpu: 1 }]) {
    await c.send('Emulation.setDeviceMetricsOverride', { width: variant.width, height: 844, deviceScaleFactor: 1, mobile: variant.mobile });
    await c.send('Emulation.setCPUThrottlingRate', { rate: variant.cpu });
    await c.send('Network.emulateNetworkConditions', { offline: false, latency: variant.mobile ? 150 : 0, downloadThroughput: variant.mobile ? 200000 : -1, uploadThroughput: variant.mobile ? 93750 : -1 });
    for (let sample = 0; sample < 3; sample++) {
      await c.navigate(`${base}/de`); await sleep(1800);
      performance.push(await c.evaluate(`({variant:${JSON.stringify(variant.name)},sample:${sample},lcpMs:window.__lab.lcp,cls:window.__lab.cls,transferBytes:performance.getEntriesByType('resource').reduce((s,e)=>s+e.transferSize,0),hero:[...document.querySelectorAll('.rebuild-hero img')].map(e=>({url:e.currentSrc,width:e.getBoundingClientRect().width,bytes:performance.getEntriesByName(e.currentSrc).at(-1)?.transferSize}))})`));
    }
  }
  await writeFile(`${directory}/results.json`, JSON.stringify({ timestamp: new Date().toISOString(), phase, method: 'Native Chrome CDP; production build; synthetic loopback database; cold browser cache; three samples per performance variant; local lab, not field CWV', rows, performance, accessibility, interactions, failures, consoleErrors: c.errors }, null, 2));
  if (phase === 'after') { assert.deepEqual(failures, []); assert.deepEqual(c.errors, []); }
  console.log(JSON.stringify({ phase, cases: rows.length, failures, performance }));
} finally {
  c?.socket.close(); chrome.kill('SIGTERM');
  await sleep(300); await rm(profile, { recursive: true, force: true, maxRetries: 3 });
}
