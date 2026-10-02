import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const browser=process.env.AGENT_BROWSER_BIN; if(!browser) throw Error('Set AGENT_BROWSER_BIN to the installed local browser CLI');
const fixture=JSON.parse(readFileSync('/tmp/tiladys-review-browser.json','utf8'));
const run=(...args)=>execFileSync(browser,args,{encoding:'utf8',timeout:30000}).trim();
run('open','http://127.0.0.1:3101/login');run('cookies','set','tiladys_session',fixture.token,'--url','http://127.0.0.1:3101');
const directory='docs/business-control/samples/bilingual-review/browser';mkdirSync(directory,{recursive:true});const results=[];
for(const width of [360,390,768,1440]){
 run('set','viewport',String(width),'900');
 for(const [name,url] of [['customer',`http://127.0.0.1:3101/dashboard/customers/${fixture.customerId}`],['company',`http://127.0.0.1:3101/dashboard/companies/${fixture.companyId}`],['job',`http://127.0.0.1:3101/dashboard/service-jobs?jobId=${fixture.jobId}`],['home','http://127.0.0.1:3100/en'],['services','http://127.0.0.1:3100/en/services'],['portfolio','http://127.0.0.1:3100/en/portfolio'],['project','http://127.0.0.1:3100/en/portfolio/synthetic-review']]){
  run('open',url);const result=JSON.parse(run('eval','JSON.stringify({viewport:innerWidth,scroll:document.documentElement.scrollWidth,content:document.body.innerText.length,overlay:!!document.querySelector("[data-nextjs-dialog]"),path:location.pathname})'));const details=typeof result==='string'?JSON.parse(result):result;
  assert.ok(details.scroll<=details.viewport,`${name} overflow at ${width}`);assert.ok(details.content>100);assert.equal(details.overlay,false);assert.ok(!details.path.includes('/login'));results.push({name,width,...details});
  if(width===360||width===1440)run('screenshot',`${directory}/${name}-${width}.png`,'--full');
 }
 console.log(`PASS public and profile/job layouts at ${width}px`);
}
writeFileSync(directory+'/layout-results.json',JSON.stringify(results,null,2));run('close');
