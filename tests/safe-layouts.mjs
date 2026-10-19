// Read-only browser checks against the explicitly bound local synthetic apps.
// Run after a production build/start: node tests/safe-layouts.mjs baseline|after
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const phase = process.argv[2];
assert.ok(['baseline', 'after'].includes(phase));
const base = 'http://127.0.0.1:3100';
const directory = `docs/safe-execution/evidence/${phase}`;
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
  pending = new Map(); next = 0; errors = [];
  constructor(url) {
    this.socket = new WebSocket(url);
    this.ready = new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve);
      this.socket.addEventListener('error', reject);
    });
    this.socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data);
      if (message.method === 'Runtime.exceptionThrown') this.errors.push(message.params.exceptionDetails.text);
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      this.pending.delete(message.id);
      message.error ? pending.reject(message.error) : pending.resolve(message.result);
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
    await this.send('Page.navigate', { url });
    await until(() => this.evaluate(`location.href === ${JSON.stringify(url)} && document.readyState === 'complete' && [...document.querySelectorAll('h1')].some(e=>e.getBoundingClientRect().width>0 && !e.closest('[hidden]'))`), url);
    await sleep(250);
  }
}
const profile = await mkdtemp(join(tmpdir(), 'tiladys-safe-chrome-'));
const chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking', '--no-first-run', '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=9338', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
const rows = [], performance = [], failures = [];
let c;
try {
  await until(async () => (await fetch('http://127.0.0.1:9338/json')).ok, 'Chrome');
  const targets = await (await fetch('http://127.0.0.1:9338/json')).json();
  c = new CDP(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
  await c.send('Page.enable'); await c.send('Runtime.enable'); await c.send('Network.enable');
  await c.send('Network.setCacheDisabled', { cacheDisabled: true });
  await c.send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__lab={lcp:0,cls:0};new PerformanceObserver(list=>{for(const e of list.getEntries())window.__lab.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__lab.cls+=e.value}).observe({type:'layout-shift',buffered:true});` });
  const routes = ['', '/services', '/services/websites', '/services/pc-laptop', '/services/3d-printing', '/portfolio', '/about', '/contact', '/products/framer', '/products/3d-models', '/privacy'];
  for (const width of [320, 360, 390, 768, 1024, 1280, 1440, 1920, 2560]) {
    await c.send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 768 });
    for (const route of routes) {
      await c.navigate(`${base}/de${route}`);
      const layout = await c.evaluate(`({width:innerWidth,scroll:document.documentElement.scrollWidth,h1:document.querySelector('h1')?.textContent,footer:document.querySelectorAll('.site-footer__grid>section').length,sections:[...document.querySelectorAll('main .section')].map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{class:e.className,x:r.x,width:r.width,content:r.width-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight)}}),cards:[...document.querySelectorAll('.rebuild-services .rebuild-card')].map(e=>e.getBoundingClientRect().width),unlabelled:[...document.querySelectorAll('input:not([type=hidden]):not(.trap),select,textarea')].filter(e=>!e.labels?.length&&!e.getAttribute('aria-label')).map(e=>e.name)})`);
      rows.push({ route, ...layout });
      if (layout.scroll > width + 1) failures.push(`Overflow: ${route || '/'} ${width}: ${layout.scroll}`);
      if (!layout.h1 || layout.footer !== 5 || layout.unlabelled.length) failures.push(`Semantics: ${route || '/'} ${width}`);
      if (width >= 1280 && layout.cards.some(card => card < 300)) failures.push(`Narrow service card: ${route || '/'} ${width}: ${layout.cards.join(',')}`);
      for (const section of layout.sections) {
        if (section.content < 200) failures.push(`Collapsed section: ${route || '/'} ${width} ${section.class}: ${section.content}`);
        if (width >= 1280 && section.width >= 1000 && Math.abs(section.x - (width - section.width) / 2) > 2) failures.push(`Uncentred section: ${route || '/'} ${width} ${section.class}`);
      }
      if (['', '/services/websites', '/contact', '/about'].includes(route) && [390, 1440, 2560].includes(width)) {
        const capture = await c.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
        await writeFile(`${directory}/${route.replaceAll('/', '-') || 'home'}-${width}.png`, Buffer.from(capture.data, 'base64'));
      }
    }
    console.log(`Checked public width ${width}`);
  }
  // Three cold-cache production samples using identical transport/CPU conditions.
  for (const variant of [{ name: 'mobile-4g', width: 390, mobile: true, cpu: 4 }, { name: 'desktop', width: 1440, mobile: false, cpu: 1 }]) {
    await c.send('Emulation.setDeviceMetricsOverride', { width: variant.width, height: 844, deviceScaleFactor: 1, mobile: variant.mobile });
    await c.send('Emulation.setCPUThrottlingRate', { rate: variant.cpu });
    await c.send('Network.emulateNetworkConditions', { offline: false, latency: variant.mobile ? 150 : 0, downloadThroughput: variant.mobile ? 200000 : -1, uploadThroughput: variant.mobile ? 93750 : -1 });
    for (let sample = 0; sample < 3; sample++) {
      await c.navigate(`${base}/de`); await sleep(1800);
      performance.push(await c.evaluate(`({variant:${JSON.stringify(variant.name)},sample:${sample},lcpMs:window.__lab.lcp,cls:window.__lab.cls,transferBytes:performance.getEntriesByType('resource').reduce((s,e)=>s+e.transferSize,0)})`));
    }
  }
  await writeFile(`${directory}/results.json`, JSON.stringify({ timestamp: new Date().toISOString(), phase, method: 'Native Chrome CDP; production build; synthetic loopback database; cold browser cache; three samples per performance variant; local lab, not field CWV', rows, performance, failures, consoleErrors: c.errors }, null, 2));
  if (phase === 'after') { assert.deepEqual(failures, []); assert.deepEqual(c.errors, []); }
  console.log(JSON.stringify({ phase, cases: rows.length, failures, performance }));
} finally {
  c?.socket.close(); chrome.kill('SIGTERM');
  await sleep(300); await rm(profile, { recursive: true, force: true, maxRetries: 3 });
}
