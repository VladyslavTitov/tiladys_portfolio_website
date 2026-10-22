// Three production Lighthouse samples per route/device. No field-INP inference.
import assert from 'node:assert/strict';import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {browserDriver} from './browser-protocol.mjs';
const {default:lighthouse}=await import('/tmp/tiladys-lighthouse/node_modules/lighthouse/core/index.js');
const {default:desktop}=await import('/tmp/tiladys-lighthouse/node_modules/lighthouse/core/config/desktop-config.js');
const f=JSON.parse(await readFile('/tmp/tiladys-complete-qa/fixtures.json','utf8')),dir='docs/qa/evidence/performance';await mkdir(dir,{recursive:true});
const b=await browserDriver(false,9342),rows=[];
const routes=[['home','/en',false],['services','/en/services/websites',false],['portfolio','/en/portfolio',false],['contact','/en/contact',false],['inbox','/dashboard/messages',true],['invoices','/dashboard/invoices',true]];
try{
 await b.cookie('tiladys_session',f.token);await b.cookie('control_locale','en');
 for(const [route,path,control] of routes)for(const mode of ['mobile','desktop'])for(let run=1;run<=3;run++){
  await b.send('Network.clearBrowserCache');const url=`http://127.0.0.1:${control?3101:3100}${path}`;
  const result=await lighthouse(url,{port:9342,logLevel:'error',onlyCategories:['performance'],disableStorageReset:true,output:'json'},mode==='desktop'?desktop:undefined);
  const l=result.lhr;assert.ok(!l.runtimeError,JSON.stringify(l.runtimeError));assert.equal(l.finalDisplayedUrl,url);const a=l.audits;
  const row={route,mode,run,version:l.lighthouseVersion,score:l.categories.performance.score,lcpMs:a['largest-contentful-paint'].numericValue,cls:a['cumulative-layout-shift'].numericValue,tbtMs:a['total-blocking-time'].numericValue,ttfbMs:a['server-response-time']?.numericValue,bytes:a['total-byte-weight'].numericValue,warnings:l.runWarnings};rows.push(row);await writeFile(`${dir}/${route}-${mode}-${run}.json`,JSON.stringify(l));await writeFile(dir+'/samples.json',JSON.stringify(rows,null,2));console.log(JSON.stringify(row));
 }
}finally{await b.close();}
const summary=[];for(const [route] of routes)for(const mode of ['mobile','desktop']){const group=rows.filter(r=>r.route===route&&r.mode===mode),metrics={};for(const key of ['score','lcpMs','cls','tbtMs','ttfbMs','bytes']){const v=group.map(r=>r[key]).filter(Number.isFinite).sort((a,b)=>a-b);metrics[key]={median:v[Math.floor(v.length/2)],min:v[0],max:v.at(-1)};}summary.push({route,mode,samples:group.length,metrics});}
await writeFile(dir+'/results.json',JSON.stringify({method:'Same unchanged local production build, three cold-browser-cache runs per route/device; server/DB warm. Lighthouse simulated throttling, installed Chrome. No before/optimized comparison because no application optimization was made; no RUM, field p75 or field INP.',summary},null,2));
