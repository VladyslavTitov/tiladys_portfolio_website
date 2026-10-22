import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {browserDriver,until,sleep} from './browser-protocol.mjs';
const before=process.argv.includes('--before'),firefox=process.argv.includes('--firefox');
const widths=(process.env.UI_WIDTHS||'320,360,375,390,430,768,1024,1280,1440,1920').split(',').map(Number);
const stage=process.env.UI_STAGE || (before?'before':'after');
assert.match(stage,/^[a-z0-9-]+$/);
const directory=`docs/ui-evidence/${stage}${firefox?'-firefox':''}`;
// Intentional visual changes require a new stage; never silently replace a baseline.
try { await readFile(`${directory}/results.json`); throw new Error(`Evidence stage already exists: ${directory}; choose a new UI_STAGE`); } catch (error) { if (error.code !== 'ENOENT') throw error; }
await mkdir(directory,{recursive:true});
const b=await browserDriver(firefox,process.env.UI_BROWSER_PORT?Number(process.env.UI_BROWSER_PORT):undefined);const rows=[],failures=[],interactions=[];
const check=(condition,label)=>{if(!condition)failures.push(label)};
const publicRoutes=['','/about','/contact','/portfolio','/services/websites','/services/pc-laptop','/services/3d-printing','/services','/products/framer','/products/3d-models'];
const controlRoutes=['','/messages','/customers','/companies','/service-jobs','/quotes','/invoices','/projects','/products','/tasks','/prices','/settings'];
const fixture=JSON.parse(await readFile('/tmp/tiladys-rebuild/browser-fixtures.json','utf8'));
const publicPort=process.env.UI_PUBLIC_PORT||'3100',controlPort=process.env.UI_CONTROL_PORT||'3101';
assert.ok(['3100','3110'].includes(publicPort));assert.ok(['3101','3111'].includes(controlPort));
try {
 await b.cookie('tiladys_session',fixture.token);await b.cookie('control_locale','de');
 for(const control of process.env.UI_SCOPE==='public'?[false]:process.env.UI_SCOPE==='control'?[true]:[false,true]) for(const width of widths){
  await b.viewport(width);
  for(const route of process.env.UI_ROUTES?process.env.UI_ROUTES.split(','):(control?controlRoutes:publicRoutes)){
   const url=`http://127.0.0.1:${control?controlPort:publicPort}/${control?'dashboard':(process.env.UI_LOCALE||'en')}${route}`;
   await b.navigate(url);
   if(control&&['/quotes','/tasks','/products'].includes(route))await until(()=>b.evaluate(`!document.querySelector('[role=status]')?.textContent.includes('Loading')`),'record list');
   const g=await b.evaluate(`(()=>{const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};const hero=document.querySelector('.about-introduction');const cards=[...document.querySelectorAll('.rebuild-services .rebuild-card')];return{width:innerWidth,scroll:document.documentElement.scrollWidth,h1:document.querySelector('h1')?.textContent,aboutInset:hero?rect(hero.querySelector('h1')).x-rect(hero).x:null,cards:cards.map(e=>({box:rect(e),media:rect(e.querySelector('.service-visual')),action:rect(e.querySelector('a.primary'))})),broken:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.getAttribute('src')),replyEditors:document.querySelectorAll('form.reply').length,kpis:[...document.querySelectorAll('.stats a')].map(e=>({label:rect(e.querySelector('span')),value:rect(e.querySelector('b'))})),fields:[...document.querySelectorAll('#contact-form input:not(.trap),#contact-form textarea,#contact-form select')].map(rect),form:document.querySelector('#contact-form')?rect(document.querySelector('#contact-form')):null,groupLast:(()=>{const e=document.querySelector('.service-example-groups');return e?{parent:rect(e),last:rect(e.lastElementChild),count:e.children.length}:null})(),aside:(()=>{const e=document.querySelector('.service-examples--grouped + .service-detail-aside');return e?{parent:rect(e.parentElement),box:rect(e)}:null})()}})()`);
   rows.push({control,route,width,...g});const label=`${control?'Control':'Public'} ${route||'/'} ${width}`;
   if(process.env.UI_INVARIANTS==='1') {
    const detail=await b.evaluate(`(()=>{const r=e=>{const b=e.getBoundingClientRect();return{x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height}};const overlap=(a,b)=>Math.min(a.right,b.right)-Math.max(a.x,b.x)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>1;return{sections:[...document.querySelectorAll('main .section')].map(r).filter(b=>b.width>=1100),heroOverlaps:[...document.querySelectorAll('.rebuild-hero,.about-introduction,.service-detail-hero,.visual-page-hero__inner')].filter(e=>e.children.length>=2&&overlap(r(e.firstElementChild),r(e.lastElementChild))).map(e=>e.className),cardEscapes:[...document.querySelectorAll('.rebuild-card')].flatMap(card=>[...card.querySelectorAll('h2,h3,p,a.primary')].filter(e=>{const a=r(card),b=r(e);return b.x<a.x+15||b.right>a.right-15}).map(e=>e.textContent.slice(0,80))),channelOverlaps:[...document.querySelectorAll('.contact-channel')].filter(e=>overlap(r(e.querySelector('.contact-channel__copy')),r(e.querySelector('.contact-channel__action')))).length,labelGaps:[...document.querySelectorAll('label')].flatMap(e=>{const field=e.querySelector('input:not([type=checkbox]):not([type=hidden]),textarea,select');const text=[...e.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());if(!field||!text||!r(field).width||getComputedStyle(field).opacity==='0')return[];const range=document.createRange();range.selectNodeContents(text);const b=range.getBoundingClientRect();return b.height?[{text:text.textContent.trim(),gap:r(field).y-b.bottom}]:[];})}})()`);
    rows.at(-1).invariants=detail;
    check(!detail.heroOverlaps.length,`${label}: overlapping hero columns`);
    check(!detail.cardEscapes.length,`${label}: card content inset`);
    check(detail.channelOverlaps===0,`${label}: channel action overlap`);
    check(detail.labelGaps.every(l=>l.gap>=3),`${label}: label/value separation ${detail.labelGaps.filter(l=>l.gap<3).map(l=>l.text).join(',')}`);
    if(width>=1280&&detail.sections.length)check(Math.max(...detail.sections.map(s=>s.x))-Math.min(...detail.sections.map(s=>s.x))<=2,`${label}: container guides`);
   }
   check(g.scroll<=width+1,`${label}: body overflow ${g.scroll}`);check(g.broken.length===0,`${label}: broken image`);
   if(g.aboutInset!==null)check(g.aboutInset>=(width>=1024?36:24)-1,`${label}: hero inset ${g.aboutInset}`);
   if(g.cards.length===3)check(g.cards.every(c=>Math.abs(c.media.width/c.media.height-16/9)<.02),`${label}: service media aspect ratio`);
   if(width>=1280&&g.cards.length===3){check(Math.max(...g.cards.map(c=>c.action.bottom))-Math.min(...g.cards.map(c=>c.action.bottom))<=8,`${label}: CTA baseline`);check(g.cards.every(c=>c.box.width>=260),`${label}: narrow cards`);check(Math.max(...g.cards.map(c=>c.media.height))-Math.min(...g.cards.map(c=>c.media.height))<=1,`${label}: unequal media`);}
   for(const k of g.kpis)check(k.value.y>=k.label.bottom-1,`${label}: concatenated KPI`);
   if(control&&route==='/messages')check(g.replyEditors<=1,`${label}: ${g.replyEditors} reply editors`);
   if(g.form)for(const field of g.fields)check(field.x>=g.form.x+12&&field.right<=g.form.right-12,`${label}: contact field boundary`);
   if(width>=1024&&g.groupLast&&g.groupLast.count%2===1)check(g.groupLast.last.width>=g.groupLast.parent.width-2,`${label}: orphan fifth group`);
   if(width>=1024&&g.aside)check(g.aside.box.width>=g.aside.parent.width-2,`${label}: half-width info row`);
   if(process.env.UI_SCREENSHOTS!=='none'&&((!control&&[375,768,1440,1920].includes(width)&&publicRoutes.slice(0,7).includes(route))||(control&&[390,1024,1440].includes(width))||width===320&&['/contact','/invoices','/messages'].includes(route)))await writeFile(`${directory}/${control?'control':'public'}-${route.replaceAll('/','-')||'home'}-${width}.png`,await b.screenshot());
  }
  console.log(`${firefox?'Firefox':'Chrome'} ${control?'Control':'public'} ${width}`);
 }
 if(!before && process.env.UI_SCOPE!=='public'){
  await b.viewport(390);await b.navigate('http://127.0.0.1:3101/dashboard/messages');
  const count=await b.evaluate(`document.querySelectorAll('.inbox-list button[data-message-id]').length`);
  if(count>1){await b.evaluate(`document.querySelectorAll('.inbox-list button[data-message-id]')[1].click()`);await sleep(200);check(await b.evaluate(`document.querySelectorAll('form.reply').length===1`),'Inbox selection keeps one reply editor');interactions.push('Inbox selection: one editor; no selection mutation');}
  await b.navigate('http://127.0.0.1:3100/en/services/3d-printing');await b.evaluate(`document.querySelector('.service-faq summary').click()`);check(await b.evaluate(`document.querySelector('.service-faq').open`),'FAQ opens');interactions.push('Native FAQ disclosure opens');
  await b.navigate('http://127.0.0.1:3100/fr/contact');check(await b.evaluate(`document.documentElement.scrollWidth<=innerWidth+1`),'French contact reflow');
 }
} finally {await writeFile(`${directory}/results.json`,JSON.stringify({browser:firefox?'Firefox':'Chrome',before,rows,failures,interactions,consoleErrors:b.errors,networkErrors:b.network},null,2));await b.close();}
// Firefox emits this pre-existing, caught validation-library JIT probe under the
// unchanged production CSP. Retain it as evidence; do not weaken CSP to silence it.
const knownSecurityDiagnostics=b.errors.filter(e=>typeof e==='object'&&e.text?.startsWith('Content-Security-Policy:')&&e.text.includes('Missing \'unsafe-eval\''));
const unexpectedErrors=b.errors.filter(e=>!knownSecurityDiagnostics.includes(e));
console.log(JSON.stringify({cases:rows.length,failures,unexpectedErrors,knownSecurityDiagnostics:knownSecurityDiagnostics.length,networkErrors:b.network}));
if(!before){assert.deepEqual(failures,[]);assert.deepEqual(unexpectedErrors,[]);assert.deepEqual(b.network,[]);}
