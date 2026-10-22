// Pinned optional audit tooling lives under /tmp; application dependencies stay unchanged.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {browserDriver} from './browser-protocol.mjs';
const {default:lighthouse}=await import('/tmp/tiladys-lighthouse/node_modules/lighthouse/core/index.js');
const {default:desktop}=await import('/tmp/tiladys-lighthouse/node_modules/lighthouse/core/config/desktop-config.js');
const fixture=JSON.parse(await readFile('/tmp/tiladys-rebuild/browser-fixtures.json','utf8'));
const b=await browserDriver(false,9342),rows=[];
const stage=process.env.LH_STAGE||'performance';assert.match(stage,/^[a-z0-9-]+$/);
const dir=`docs/ui-evidence/${stage}`;await mkdir(dir,{recursive:true});
const allRoutes=[{name:'home',path:'/en'},{name:'services',path:'/en/services/websites'},{name:'portfolio',path:'/en/portfolio'},{name:'contact',path:'/en/contact'},{name:'dashboard',path:'/dashboard',control:true},{name:'invoices',path:'/dashboard/invoices',control:true}];
const routes=process.env.LH_ROUTES?allRoutes.filter(r=>process.env.LH_ROUTES.split(',').includes(r.name)):allRoutes.slice(0,5);
const phases=process.env.LH_PHASES?process.env.LH_PHASES.split(','):['before','after'];assert.ok(phases.every(p=>['before','after'].includes(p)));assert.ok(routes.length);
try {
 await b.cookie('tiladys_session',fixture.token);await b.cookie('control_locale','de');
 for(const route of routes)for(const mode of ['mobile','desktop'])for(const phase of phases) {
  const port=route.control?(phase==='before'?3111:3101):(phase==='before'?3110:3100);
  const url=`http://127.0.0.1:${port}${route.path}`;
  await b.send('Network.clearBrowserCache');
  const result=await lighthouse(url,{port:9342,logLevel:'error',onlyCategories:['performance','accessibility'],disableStorageReset:true,output:'json'},mode==='desktop'?desktop:undefined);
  assert.ok(result?.lhr);assert.ok(!result.lhr.runtimeError,JSON.stringify(result.lhr.runtimeError));assert.equal(result.lhr.finalDisplayedUrl,url,'Authenticated destination remains the audited route');
  const {lhr}=result;const a=lhr.audits;
  const row={route:route.name,phase,mode,version:lhr.lighthouseVersion,performance:lhr.categories.performance.score,accessibility:lhr.categories.accessibility.score,lcpMs:a['largest-contentful-paint'].numericValue,cls:a['cumulative-layout-shift'].numericValue,tbtMs:a['total-blocking-time'].numericValue,transferBytes:a['total-byte-weight'].numericValue,requests:a['network-requests'].details.items.length,warnings:lhr.runWarnings};
  rows.push(row);await writeFile(`${dir}/${route.name}-${mode}-${phase}.json`,JSON.stringify(lhr));
  console.log(JSON.stringify(row));
 }
}finally {await writeFile(`${dir}/results.json`,JSON.stringify({method:'Lighthouse 13.4.1 simulated mobile/desktop; same installed Chrome and local synthetic records; one sample per route/mode/state; no field INP/p75 inference; authenticated browser cookies in memory only',rows},null,2));await b.close();}
