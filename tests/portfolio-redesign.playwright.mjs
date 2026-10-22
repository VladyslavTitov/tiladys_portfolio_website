// Real local production apps + isolated database fixtures. No external actions.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,access} from 'node:fs/promises';
import {chromium} from '/tmp/tiladys-contact-playwright/node_modules/playwright-core/index.mjs';
const phase=process.argv[2];assert.ok(['before','after'].includes(phase));
const widths=[320,375,430,768,1024,1280,1440,1920],dir=`docs/portfolio-redesign-evidence/${phase}`;
try{await access(`${dir}/results.json`);throw Error('Preserve this evidence stage before rerunning');}catch(e){if(e.code!=='ENOENT')throw e;}
await mkdir(dir,{recursive:true});
const fixture=JSON.parse(await readFile('/tmp/tiladys-portfolio-redesign/fixtures.json','utf8'));
const categories=new Map(fixture.records.map(r=>[r.slug,r.category]));
for(const category of ['web-development','pc-support','3d-printing'])categories.set(`synthetic-${category}`,category);
const publicGroup=c=>c==='web-development'?'websites':c==='3d-printing'?'3d-printing':c==='linux-servers'?'linux-servers':'services';
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
const context=await b.newContext({reducedMotion:'reduce',deviceScaleFactor:1});const p=await context.newPage();
const rows=[],checks=[],errors=[],network=[];let scope='matrix';
p.on('pageerror',e=>errors.push({scope,message:e.message}));p.on('console',e=>{if(e.type()==='error')errors.push({scope,message:e.text()});});p.on('response',r=>{if(r.status()>=400)network.push({scope,status:r.status(),url:r.url()});});
const wait=()=>p.waitForFunction(()=>{const status=document.querySelector('.portfolio-result-count');return status&&!status.textContent.includes('Updating')&&document.querySelector('.portfolio-results')?.getAttribute('aria-busy')==='false';});
const slugs=()=>p.locator('.portfolio-card__body h2 a').evaluateAll(as=>as.map(a=>a.getAttribute('href').split('/').pop()));
const filter=async(key,label)=>{await p.getByRole('button',{name:label,exact:true}).click();await p.waitForFunction(k=>new URL(location.href).searchParams.get('filter')===(k==='all'?null:k),key);await wait();};
try{
 for(const locale of phase==='before'?['en']:['en','de','fr','sk','uk','ru'])for(const width of widths){
  await p.setViewportSize({width,height:1000});const response=await p.goto(`http://127.0.0.1:3100/${locale}/portfolio`,{waitUntil:'networkidle'});assert.equal(response.status(),200);
  await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode().catch(()=>{});}));});
  const data=await p.evaluate(()=>{
   const r=e=>{const v=e.getBoundingClientRect();return{x:v.x,y:v.y,right:v.right,bottom:v.bottom,width:v.width,height:v.height};};const grid=document.querySelector('.portfolio-grid');
   return{overflow:document.documentElement.scrollWidth>innerWidth,carousel:document.querySelectorAll('.featured-rotation,.featured-project,.featured-controls').length,hero:!!document.querySelector('.portfolio-hero h1'),filters:[...document.querySelectorAll('.portfolio-filter button')].map(e=>({text:e.textContent,pressed:e.getAttribute('aria-pressed'),...r(e)})),selects:document.querySelectorAll('.portfolio-content select').length,columns:grid?getComputedStyle(grid).gridTemplateColumns.split(' ').length:0,broken:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.src),cards:[...document.querySelectorAll('.portfolio-card')].map(e=>{const image=e.querySelector('.portfolio-card__image'),body=e.querySelector('.portfolio-card__body'),action=body.querySelector('.portfolio-card__action')||body.querySelector('a');return{card:r(e),image:r(image),body:r(body),action:r(action),title:r(body.querySelector('h2')),href:body.querySelector('a').getAttribute('href'),fit:image.querySelector('img')?getComputedStyle(image.querySelector('img')).objectFit:null};})};
  });rows.push({locale,width,htmlBytes:(await response.body()).length,...data});
  if(phase==='after'){
   assert.equal(data.carousel,0);assert.ok(data.hero);assert.equal(data.filters.length,5);assert.equal(data.selects,0);assert.equal(data.filters.filter(f=>f.pressed==='true').length,1);assert.ok(data.filters.every(f=>f.height>=44));assert.equal(data.columns,width<=430?1:width<=768?2:3);assert.equal(data.overflow,false);assert.deepEqual(data.broken,[]);assert.ok(data.cards.length<=12);
   for(const c of data.cards){assert.ok(Math.abs(c.image.width/c.image.height-1.6)<.02);assert.ok(c.body.x>=c.card.x&&c.body.right<=c.card.right);assert.ok(c.title.y>=c.image.bottom);assert.ok(c.action.y>=c.title.bottom);assert.ok(c.action.bottom<=c.card.bottom);}
   const top=data.cards[0].card.y,actions=data.cards.filter(c=>Math.abs(c.card.y-top)<1).map(c=>c.action.bottom);assert.ok(Math.max(...actions)-Math.min(...actions)<2);
  }
  if(locale==='en'){await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await p.screenshot({path:`${dir}/portfolio-${width}.png`,fullPage:true,animations:'disabled'});}
 }
 if(phase==='after'){
  scope='interactions';await p.setViewportSize({width:1440,height:1000});await p.goto('http://127.0.0.1:3100/en/portfolio');await wait();
  assert.deepEqual(await p.locator('.portfolio-filter button').allTextContents(),['All Projects','Websites','Service Works','3D Printing','Linux & Servers']);
  await filter('websites','Websites');assert.ok((await slugs()).every(s=>categories.get(s)==='web-development'));assert.equal(await p.locator('.portfolio-card').count(),12);
  await p.getByRole('searchbox').fill('Needle');await p.waitForURL('**/portfolio?filter=websites&q=Needle');await wait();assert.equal(await p.locator('.portfolio-card').count(),1);assert.ok((await slugs()).every(s=>categories.get(s)==='web-development'));
  checks.push('Debounced title/summary search combines with Websites through real server filtering.');
  await p.getByRole('button',{name:'Clear search',exact:true}).click();await p.waitForFunction(()=>!new URL(location.href).searchParams.has('q'));await wait();assert.equal(await p.locator('.portfolio-card').count(),12);assert.equal(new URL(p.url()).searchParams.get('filter'),'websites');
  await filter('services','Service Works');assert.ok((await slugs()).every(s=>publicGroup(categories.get(s))==='services'));assert.ok((await slugs()).some(s=>categories.get(s)==='legacy-unclassified'));
  await p.getByRole('searchbox').fill('Needle');await p.waitForFunction(()=>new URL(location.href).searchParams.get('q')==='Needle');await wait();assert.equal(await p.locator('.portfolio-card').count(),0);assert.ok(await p.locator('.portfolio-empty').isVisible());await p.screenshot({path:`${dir}/empty-search.png`,fullPage:true});
  await p.getByRole('button',{name:'Clear search',exact:true}).click();await p.waitForFunction(()=>!new URL(location.href).searchParams.has('q'));await wait();assert.ok(await p.locator('.portfolio-card').count());
  checks.push('Service Works includes all remaining internal and unknown categories; Clear search preserves the selected group; no matches has a useful empty state.');
  await filter('all','All Projects');assert.equal(new URL(p.url()).searchParams.has('filter'),false);
  await p.locator('.record-pagination button').last().click();await p.waitForFunction(()=>new URL(location.href).searchParams.get('page')==='2');await wait();
  await filter('linux-servers','Linux & Servers');assert.equal(new URL(p.url()).searchParams.has('page'),false);assert.ok((await slugs()).every(s=>categories.get(s)==='linux-servers'));
  await filter('3d-printing','3D Printing');assert.ok((await slugs()).every(s=>categories.get(s)==='3d-printing'));assert.ok((await p.locator('.portfolio-card__image img').evaluateAll(is=>is.map(i=>getComputedStyle(i).objectFit))).every(f=>f==='contain'));
  await p.goBack();await p.waitForFunction(()=>new URL(location.href).searchParams.get('filter')==='linux-servers');await wait();assert.ok((await slugs()).every(s=>categories.get(s)==='linux-servers'));
  await p.goForward();await p.waitForFunction(()=>new URL(location.href).searchParams.get('filter')==='3d-printing');await wait();
  checks.push('All five choices, bounded pagination/reset, contained 3D previews and browser Back/Forward return the correct projects.');
  await p.getByRole('searchbox').fill('Ne');await p.waitForTimeout(340);await p.getByRole('searchbox').fill('Needle');await p.getByRole('button',{name:'Websites',exact:true}).click();await p.waitForFunction(()=>new URL(location.href).searchParams.get('q')==='Needle'&&new URL(location.href).searchParams.get('filter')==='websites');await wait();assert.equal(await p.getByRole('searchbox').inputValue(),'Needle');assert.equal(await p.locator('.portfolio-card').count(),1);
  await p.goBack();await p.waitForFunction(()=>document.querySelector('#portfolio-search').value===(new URL(location.href).searchParams.get('q')||''));await p.goForward();await wait();assert.equal(await p.getByRole('searchbox').inputValue(),'Needle');checks.push('Rapid typing/category selection and history navigation preserve the visible search draft and URL.');
  await p.locator('.portfolio-card__action').first().click();await p.waitForURL(/\/portfolio\/portfolio-qa-/);assert.ok(await p.locator('h1').isVisible());checks.push('Existing project-detail URLs open successfully.');
  scope='negative-visibility';
  for(const status of ['draft','archived']){const row=fixture.records.find(r=>r.slug.endsWith(`-${status}`));const res=await p.request.get(`http://127.0.0.1:3100/en/portfolio/${row.slug}`);assert.equal(res.status(),404);const image=await p.request.get(`http://127.0.0.1:3100/api/public/media/${row.images[0].id}?w=384`);assert.equal(image.status(),404);assert.match(image.headers()['cache-control'],/no-store/);}
  scope='interactions';await p.goto('http://127.0.0.1:3100/en/portfolio?filter=services');await wait();assert.ok(await p.locator('.portfolio-card__placeholder').count());await p.screenshot({path:`${dir}/branded-missing-cover.png`,fullPage:true});checks.push('Draft/archived details and derivative media remain inaccessible; missing public covers have a reserved branded fallback.');
  for(const width of [375,1440])for(const route of ['','/about','/contact']){await p.setViewportSize({width,height:1000});const r=await p.goto(`http://127.0.0.1:3100/en${route}`,{waitUntil:'networkidle'});assert.equal(r.status(),200);assert.ok(await p.locator('h1').isVisible());assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(route==='/contact'){const sizes=await p.locator('.contact-channel__action').evaluateAll(as=>as.map(a=>({w:a.getBoundingClientRect().width,h:a.getBoundingClientRect().height})));assert.ok(sizes.every(s=>s.w===150&&s.h===44));}}
  checks.push('Home/About/Contact remain usable at mobile/desktop; the prior seven 150×44 contact buttons remain intact.');
 }
}finally{await writeFile(`${dir}/results.json`,JSON.stringify({phase,tool:'Playwright 1.64.1',rows,checks,errors,network},null,2));await b.close();}
if(phase==='after'){assert.equal(rows.length,48);assert.deepEqual(errors,[]);assert.deepEqual(network.filter(r=>r.scope!=='negative-visibility'),[]);}
console.log(JSON.stringify({phase,cases:rows.length,checks:checks.length,errors,network}));
