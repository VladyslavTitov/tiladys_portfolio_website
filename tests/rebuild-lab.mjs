import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile,mkdir,writeFile,rm,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(check,label,timeout=60000){const started=Date.now();while(Date.now()-started<timeout){try{if(await check())return;}catch{}await sleep(100);}throw Error('Timeout: '+label);}
class CDP {
  constructor(url) {
    this.socket = new WebSocket(url); this.next = 0; this.pending = new Map(); this.errors = []; this.requests=new Map();this.loaded=new Set();
    this.ready = new Promise((resolve, reject) => { this.socket.addEventListener('open', resolve); this.socket.addEventListener('error', reject); });
    this.socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data);
      if(message.method==='Page.lifecycleEvent'&&message.params.name==='load')this.loaded.add(message.params.loaderId);
      if(message.method==='Network.requestWillBeSent')this.requests.set(message.params.requestId,{url:message.params.request.url,type:message.params.type});
      if(['Network.loadingFinished','Network.loadingFailed'].includes(message.method))this.requests.delete(message.params.requestId);
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
    await this.send('Page.stopLoading');
    const navigation=await this.send('Page.navigate', { url });if(navigation.errorText)throw Error(`Navigation error ${url}: ${navigation.errorText}`);
    try{if(navigation.loaderId)await until(()=>this.loaded.has(navigation.loaderId),`Loader ${url}`);await until(() => this.evaluate(`location.href === ${JSON.stringify(url)} && document.readyState === 'complete' && Boolean(document.documentElement) && (${JSON.stringify(url)} === 'about:blank' || Boolean(document.querySelector('h1')))`), url);}catch(error){console.error('Pending resource URLs', [...this.requests.values()]);console.error('Navigation state',await this.evaluate(`({href:location.href,ready:document.readyState,h1:document.querySelector('h1')?.textContent,body:document.body?.textContent.slice(0,250)})`).catch(()=>({unavailable:true})));throw error;}
    await sleep(300);
  }
}

const base='http://127.0.0.1:3200';
assert.equal(process.env.REBUILD_LAB_SYNTHETIC,'true','Explicit synthetic local production-server binding required');
const profile=await mkdtemp(join(tmpdir(),'tiladys-rebuild-lab-'));
const chrome=spawn('google-chrome',['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--remote-debugging-address=127.0.0.1','--remote-debugging-port=9337',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
const directory='docs/tiladys-rebuild/implementation/evidence/lab';await mkdir(directory,{recursive:true});let c;const results=[];
try{
 await until(async()=>(await fetch('http://127.0.0.1:9337/json')).ok,'Chrome');const targets=await(await fetch('http://127.0.0.1:9337/json')).json();c=new CDP(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await c.send('Page.enable');await c.send('Page.setLifecycleEventsEnabled',{enabled:true});await c.send('Network.enable');await c.send('Runtime.enable');await c.send('Accessibility.enable');await c.send('Network.setCacheDisabled',{cacheDisabled:true});
 await c.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__lab={lcp:0,cls:0};new PerformanceObserver(list=>{for(const entry of list.getEntries())window.__lab.lcp=entry.startTime;}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(list=>{for(const entry of list.getEntries())if(!entry.hadRecentInput)window.__lab.cls+=entry.value;}).observe({type:'layout-shift',buffered:true});`});
 for(const variant of [{name:'mobile-4g',width:390,height:844,mobile:true,throttled:true},{name:'desktop',width:1440,height:1000,mobile:false},{name:'landscape',width:844,height:390,mobile:true},{name:'200-percent-equivalent-reflow',width:720,height:500,mobile:false}]){
  await c.navigate('about:blank');await c.send('Emulation.setDeviceMetricsOverride',{...Object.fromEntries(['width','height','mobile'].map(k=>[k,variant[k]])),deviceScaleFactor:1});await c.send('Emulation.setCPUThrottlingRate',{rate:variant.throttled?4:1});await c.send('Network.emulateNetworkConditions',{offline:false,latency:variant.throttled?150:0,downloadThroughput:variant.throttled?200000:-1,uploadThroughput:variant.throttled?93750:-1});await c.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await c.navigate(base+'/de');await sleep(1800);
  const measurements=await c.evaluate(`({variant:${JSON.stringify(variant.name)},width:innerWidth,scroll:document.documentElement.scrollWidth,lcpMs:window.__lab.lcp,cls:window.__lab.cls,transferBytes:performance.getEntriesByType('resource').reduce((sum,e)=>sum+e.transferSize,0),footerColumns:document.querySelectorAll('.site-footer__grid>section').length,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,heroImageLoaded:[...document.images].filter(i=>i.closest('.rebuild-hero')).every(i=>i.complete&&i.naturalWidth>0)})`);assert.ok(measurements.scroll<=measurements.width+1);assert.equal(measurements.footerColumns,5);assert.ok(measurements.reducedMotion);assert.ok(measurements.heroImageLoaded);results.push(measurements);console.log(measurements);
  if(['mobile-4g','desktop'].includes(variant.name)){await c.evaluate(`Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode().catch(()=>{});}));`);const cap=await c.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(`${directory}/${variant.name}.png`,Buffer.from(cap.data,'base64'));}
  const tree=await c.send('Accessibility.getFullAXTree');assert.ok(tree.nodes.some(n=>n.role?.value==='heading'&&n.name?.value.includes('Websites')));assert.ok(tree.nodes.some(n=>n.role?.value==='link'&&n.name?.value==='Kontakt'));const unnamed=tree.nodes.filter(n=>!n.ignored&&['button','textbox','combobox'].includes(n.role?.value)&&!n.name?.value);assert.deepEqual(unnamed,[],'Unnamed interactive accessibility nodes');
 }
 const contact=await fetch(base+'/de/contact');assert.ok(!(await contact.text()).includes('name="images"'),'Production local-test photo adapter must remain unavailable');
 await writeFile(directory+'/results.json',JSON.stringify({timestamp:new Date().toISOString(),runtime:process.version,build:'Next 16.3.8 webpack production, isolated synthetic database',method:'Cold browser cache; mobile 1.6Mbps/150ms RTT/4x CPU, local loopback server. One lab sample per variant; 720px models reflow at 200% on 1440px. AX tree is not manual screen-reader verification.',results,consoleErrors:c.errors},null,2));assert.deepEqual(c.errors,[]);console.log('PASS production lab images, layout, reduced motion and accessible names.');
}finally{c?.socket.close();chrome.kill('SIGTERM');await sleep(300);await rm(profile,{recursive:true,force:true,maxRetries:3});}
