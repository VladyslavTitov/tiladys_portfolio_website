import crypto from 'node:crypto';
import {PrismaClient} from '@prisma/client';
import sharp from 'sharp';
const databaseUrl=new URL(process.env.DATABASE_URL||'http://missing');if(databaseUrl.hostname!=='127.0.0.1'||databaseUrl.port!=='55432'||databaseUrl.pathname!=='/tiladys_rebuild_test')throw Error('ISOLATED_SYNTHETIC_DATABASE_REQUIRED');
const database=new PrismaClient();
await database.contactRateLimit.deleteMany({});
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
const web='http://127.0.0.1:3100',control='http://127.0.0.1:3101';
const fixture=JSON.parse(await readFile('/tmp/tiladys-rebuild/browser-fixtures.json','utf8'));
const profile=await mkdtemp(join(tmpdir(),'tiladys-rebuild-browser-'));
const chrome=spawn('google-chrome',['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--remote-debugging-address=127.0.0.1','--remote-debugging-port=9336',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
let connection;const evidence='docs/tiladys-rebuild/implementation/evidence/browser';await mkdir(evidence,{recursive:true});const results=[];
try{
 await until(async()=> (await fetch('http://127.0.0.1:9336/json')).ok,'Chrome');
 const targets=await (await fetch('http://127.0.0.1:9336/json')).json();connection=new CDP(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await connection.send('Page.enable');await connection.send('Page.setLifecycleEventsEnabled',{enabled:true});await connection.send('Runtime.enable');await connection.send('Network.enable');await connection.send('Network.setCacheDisabled',{cacheDisabled:true});
 async function snapshot(name){await connection.evaluate(`Promise.all([...document.images].map(img=>{img.loading='eager';return img.decode().catch(()=>{});}));`);await sleep(250);const capture=await connection.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(`${evidence}/${name}.png`,Buffer.from(capture.data,'base64'));}
 const phase=process.env.REBUILD_BROWSER_PHASE||'all';assert.ok(['all','control'].includes(phase));
 if(phase!=='control'){
 const publicRoutes=['','services','services/websites','services/3d-printing','services/pc-laptop','portfolio','portfolio/synthetic-web-development','products/framer','products/3d-models','products/synthetic-template','about','contact','privacy','not-a-real-page'];
 for(const width of [320,360,390,768,1024,1280,1440]){
  await connection.navigate('about:blank');
  await connection.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
  for(const route of publicRoutes){await connection.navigate(`${web}/de${route?'/'+route:''}`);const size=await connection.evaluate(`({scroll:document.documentElement.scrollWidth,width:innerWidth,h1:document.querySelector('h1')?.textContent,footer:document.querySelectorAll('.site-footer__grid>section').length,fields:[...document.querySelectorAll('input:not([type=hidden]):not(.trap),textarea,select')].filter(e=>!e.labels?.length).map(e=>e.name)})`);results.push({page:'/de/'+route,width,...size});assert.ok(size.scroll<=size.width+1,`Horizontal overflow ${route} at ${width}: ${size.scroll}`);assert.ok(size.h1,`Missing H1 ${route}`);assert.equal(size.footer,5,`Five-column footer ${route}`);assert.deepEqual(size.fields,[],`Unlabelled fields ${route}`);}
  await connection.navigate(`${web}/de`);if([390,1440].includes(width))await snapshot(`home-de-${width}`);
  if(width===390){await until(()=>connection.evaluate(`Object.keys(document.querySelector('.mobile-menu-button')).some(k=>k.startsWith('__reactFiber'))`),'header hydrated');await connection.evaluate(`document.querySelector('.mobile-menu-button').click()`);await until(()=>connection.evaluate(`document.querySelector('.mobile-menu-button').getAttribute('aria-expanded')==='true'`),'mobile menu opened');const menu=await connection.evaluate(`({header:document.querySelector('.site-header').getBoundingClientRect().bottom,nav:document.querySelector('.site-nav').getBoundingClientRect().top})`);assert.ok(Math.abs(menu.header-menu.nav)<3,'Menu starts under header');await connection.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await connection.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await until(()=>connection.evaluate(`document.activeElement===document.querySelector('.mobile-menu-button')`),'Escape restored focus');await connection.evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');await sleep(100);}
  console.log('PASS public width',width);
 }
 console.log('PASS public native routes at all 7 widths, five-column footer, labelled fields and menu Escape focus.');
 for(const locale of ['en','uk','ru','sk','fr']){await connection.navigate(`${web}/${locale}/services/3d-printing`);assert.equal(await connection.evaluate('document.documentElement.lang'),locale);}
 await writeFile(`${evidence}/public-layout.json`,JSON.stringify({provenance:'Public phase from this browser run',results:results.filter(r=>r.page.startsWith('/de/'))},null,2));
 }else{const prior=JSON.parse(await readFile(`${evidence}/public-layout.json`,'utf8'));assert.equal(prior.results.length,98);results.push(...prior.results);console.log('REUSE previously passed public phase; executing private phase after Control-only changes.');}
 const anonymous=await fetch(`${control}/api/admin/tasks`);assert.equal(anonymous.status,401);
 await connection.send('Network.setCookie',{name:'tiladys_session',value:fixture.token,url:control,httpOnly:true,sameSite:'Strict'});
 for(const width of [320,360,390,768,1024,1280,1440]){await connection.navigate('about:blank');await connection.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});for(const route of ['','messages','customers','service-jobs','quotes','products','tasks','invoices','prices','settings','settings/account','settings/data']){await connection.navigate(`${control}/dashboard${route?'/'+route:''}`);const size=await connection.evaluate(`({scroll:document.documentElement.scrollWidth,width:innerWidth,h1:document.querySelector('h1')?.textContent,authenticated:Boolean(document.querySelector('.control-toolbar'))})`);assert.ok(size.authenticated,'Authenticated Control shell required');results.push({page:'/dashboard/'+route,width,...size});assert.ok(size.scroll<=size.width+1,`Control overflow ${route} at ${width}: ${size.scroll}`);assert.ok(size.h1,`Missing Control H1 ${route}`);}await connection.navigate(`${control}/dashboard`);if([390,1440].includes(width))await snapshot(`control-${width}`);}
 console.log('PASS authenticated Control routes at phone/tablet/desktop using real isolated database.');
 await connection.navigate(`${control}/dashboard/tasks?new=1`);
 await until(()=>connection.evaluate(`Object.keys(document.querySelector('.control-language select')).some(k=>k.startsWith('__reactFiber'))`),'language picker hydrated');
 await connection.evaluate(`(()=>{const select=document.querySelector('.control-language select');select.value='de';select.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 await until(()=>connection.evaluate(`document.documentElement.lang==='de'&&document.querySelector('h1').textContent==='Aufgaben'`),'UI language changed without navigation');
 for(const width of [320,390,768,1024,1440]){await connection.navigate('about:blank');await connection.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});for(const route of ['tasks','quotes','products','invoices','customers','settings']){await connection.navigate(`${control}/dashboard/${route}`);const layout=await connection.evaluate(`({scroll:document.documentElement.scrollWidth,width:innerWidth,lang:document.documentElement.lang,h1:document.querySelector('h1')?.textContent})`);results.push({page:'/dashboard/'+route,locale:'de',...layout});assert.ok(layout.scroll<=layout.width+1,`German Control overflow ${route} ${width}`);assert.equal(layout.lang,'de');if(route==='tasks')assert.equal(layout.h1,'Aufgaben');}}
 await connection.send('Network.setCookie',{name:'control_locale',value:'en',url:control,sameSite:'Strict'});
 console.log('PASS German Control dictionary, saved UI language, and long-label responsive layouts.');

 // Native controls, explicit DST resolution, persisted calendar, and phone Back preserve a draft.
 await connection.send('Emulation.setTimezoneOverride',{timezoneId:'Europe/Berlin'});
 await connection.send('Emulation.setDeviceMetricsOverride',{width:390,height:1000,deviceScaleFactor:1,mobile:true});
 await connection.navigate(`${control}/dashboard/tasks?new=1`);
 await until(()=>connection.evaluate(`Object.keys(document.querySelector('input[maxlength="240"]')).some(k=>k.startsWith('__reactFiber'))`),'task editor hydrated');
 await connection.evaluate(`document.querySelector('input[maxlength="240"]').focus()`);
 const taskTitle=`Synthetic DST browser task ${crypto.randomUUID()}`;
 await connection.send('Input.insertText',{text:taskTitle});
 await connection.evaluate(`document.querySelector('.mobile-record-back').click()`);
 assert.equal(await connection.evaluate(`document.querySelector('input[maxlength="240"]').value`),taskTitle);
 await connection.evaluate(`document.querySelector('[data-resume-draft]').click()`);
 assert.ok(await connection.evaluate(`getComputedStyle(document.querySelector('form.record-editor')).display!=='none'`));
 assert.equal(await connection.evaluate(`document.querySelector('input[maxlength="240"]').value`),taskTitle);
 await connection.evaluate(`(()=>{const input=document.querySelector('input[type=datetime-local]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'2026-10-25T02:30');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await until(()=>connection.evaluate(`[...document.querySelectorAll('.record-editor label')].some(label=>label.textContent.includes('Repeated local time'))`),'DST choice displayed');
 await connection.evaluate(`(()=>{const label=[...document.querySelectorAll('.record-editor label')].find(label=>label.textContent.includes('Repeated local time'));label.querySelector('select').value='2026-10-25T01:30:00.000Z';label.querySelector('select').dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('form.record-editor').requestSubmit();})()`);
 await until(()=>connection.evaluate(`document.querySelector('form.record-editor [role=status]')?.textContent==='Task saved.'`),'DST task persisted');
 const storedDst=await database.task.findFirstOrThrow({where:{title:taskTitle}});assert.equal(storedDst.timeZone,'Europe/Berlin');assert.equal(storedDst.dueAt.toISOString(),'2026-10-25T01:30:00.000Z');
 await connection.navigate(`${control}/dashboard/tasks?view=calendar&month=2026-10`);await until(()=>connection.evaluate(`document.body.textContent.includes(${JSON.stringify(taskTitle)})`),'calendar has persisted DST task');
 assert.ok(await connection.evaluate(`document.querySelector('.task-calendar').textContent.includes('01:30 UTC')`));
 console.log('PASS phone list/detail Back retains input, explicit repeated DST occurrence persists, and calendar uses the same UTC instant.');
 const headers={'Content-Type':'application/json',cookie:`tiladys_session=${fixture.token}`,origin:control};
 const denied=await fetch(`${control}/api/admin/tasks`,{method:'POST',headers:{...headers,origin:'https://evil.example.test'},body:JSON.stringify({title:'Forbidden',status:'TODO',priority:1,dueAt:null,customerId:null,serviceJobId:null})});assert.equal(denied.status,403);
 const task=await fetch(`${control}/api/admin/tasks`,{method:'POST',headers,body:JSON.stringify({title:'Synthetic browser task',status:'TODO',priority:1,dueAt:null,customerId:null,serviceJobId:null})});assert.equal(task.status,201);const t=await task.json();const changed={revision:t.revision,title:'Synthetic browser task saved',description:'',status:'DONE',priority:1,dueAt:null,customerId:null,serviceJobId:null};assert.equal((await fetch(`${control}/api/admin/tasks/${t.id}`,{method:'PATCH',headers,body:JSON.stringify(changed)})).status,200);assert.equal((await fetch(`${control}/api/admin/tasks/${t.id}`,{method:'PATCH',headers,body:JSON.stringify(changed)})).status,409);
 assert.equal((await fetch(`${web}/api/public/product-media/${fixture.privateProductImage}`)).status,404);
 await database.contactRateLimit.deleteMany({});
 for(const [index,message] of ['  English original 🙂\nsecond line  ','  Український текст 🙂\nдругий рядок  ','  Русский текст 🙂\nвторая строка  ','  Deutsche Nachricht 🙂\nzweite Zeile  '].entries()){const key=crypto.randomUUID();const body={name:'Synthetic browser enquiry',email:`synthetic-${index}@example.test`,service:'3d-printing',locale:'de',message,consent:true};const req={method:'POST',headers:{'Content-Type':'application/json',origin:web,'Idempotency-Key':key,'x-forwarded-for':`192.0.2.${20+index}`},body:JSON.stringify(body)};const first=await fetch(`${web}/api/contact`,req);assert.equal(first.status,201);const receipt=await first.json();const stored=await database.contactMessage.findFirstOrThrow({where:{email:body.email},orderBy:{createdAt:'desc'}});assert.equal(stored.message,message);if(index===0){const replay=await fetch(`${web}/api/contact`,req);assert.equal(replay.status,201);assert.equal((await replay.json()).reference,receipt.reference);}}

 // Exercise the real browser metadata -> direct bytes -> contact -> private inbox path.
 await database.contactRateLimit.deleteMany({});
 const photoPath='/tmp/tiladys-rebuild/browser-photo.png';
 await sharp({create:{width:80,height:60,channels:3,background:'white'}}).png().toFile(photoPath);
 await connection.navigate(`${web}/de/contact?service=3d-printing&mode=idea`);
 await until(()=>connection.evaluate(`Object.keys(document.querySelector('#contact-form')).some(k=>k.startsWith('__reactFiber'))`),'contact hydrated');
 const doc=await connection.send('DOM.getDocument');const input=await connection.send('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'input[name=images]'});assert.ok(input.nodeId,'Configured local photo selector');
 await connection.send('DOM.setFileInputFiles',{nodeId:input.nodeId,files:[photoPath]});
 const originalPhotoBody='  Synthetic browser photo request 🙂\nзбережений оригінал  ';
 const photoCountBefore=await database.contactMessage.count({where:{email:'synthetic-photo@example.test'}});
 await connection.evaluate(`(()=>{window.__originalFetch=window.fetch;window.__photoPuts=0;let lose=true;window.fetch=async(...args)=>{if(String(args[0]).includes(':3002/photos/'))window.__photoPuts++;const response=await window.__originalFetch(...args);if(String(args[0])==='/api/contact'&&response.status===201&&lose){lose=false;await response.clone().json();throw new TypeError('Synthetic lost acknowledgement');}return response;};})()`);
 await connection.evaluate(`(()=>{const f=document.querySelector('#contact-form');f.elements.name.value='Synthetic photo client';f.elements.email.value='synthetic-photo@example.test';f.elements.message.value=${JSON.stringify(originalPhotoBody)};f.elements.consent.checked=true;f.requestSubmit();})()`);
 await until(()=>connection.evaluate(`document.querySelector('[data-result]').dataset.result==='network'`),'lost photo acknowledgement retained form');
 await connection.evaluate(`document.querySelector('#contact-form').requestSubmit()`);
 await until(()=>connection.evaluate(`document.querySelector('[data-result]').dataset.result==='success'`),'photo contact retry receipt');
 assert.equal(await connection.evaluate('window.__photoPuts'),1);await connection.evaluate('window.fetch=window.__originalFetch');
 assert.equal(await database.contactMessage.count({where:{email:'synthetic-photo@example.test'}}),photoCountBefore+1);
 const savedPhoto=await database.contactMessage.findFirstOrThrow({where:{email:'synthetic-photo@example.test'},orderBy:{createdAt:'desc'},include:{attachments:true}});assert.equal(savedPhoto.message,originalPhotoBody);assert.equal(savedPhoto.attachments.length,1);assert.equal(savedPhoto.attachments[0].mimeType,'image/webp');
 const privatePhoto=`${control}/api/admin/messages/${savedPhoto.id}/attachments/${savedPhoto.attachments[0].id}`;
 assert.equal((await fetch(privatePhoto)).status,401);assert.equal((await fetch(privatePhoto,{headers})).status,200);
 // Retained removed media must be denied at both public origins, including derivatives.
 const retained=await database.projectImage.findFirstOrThrow({where:{project:{slug:'synthetic-web-development'},archivedAt:null}});
 await database.projectImage.update({where:{id:retained.id},data:{archivedAt:new Date()}});
 try { for(const base of [web,control]) for(const suffix of ['', '?w=320']) assert.equal((await fetch(`${base}/api/public/media/${retained.id}${suffix}`)).status,404); }
 finally { await database.projectImage.update({where:{id:retained.id},data:{archivedAt:null}}); }
 const exported=await fetch(`${control}/api/admin/export`,{method:'POST',headers,body:JSON.stringify({scope:'tasks'})});assert.equal(exported.status,200);const artifact=await exported.json();assert.equal((await fetch(control+artifact.url)).status,401);const download=await fetch(control+artifact.url,{headers});assert.equal(download.status,200);assert.match(download.headers.get('cache-control'),/no-store/);assert.match(await download.text(),/Synthetic browser task/);
 const tokenHash=crypto.createHash('sha256').update(artifact.url.split('/').at(-1)).digest('hex');await database.exportArtifact.update({where:{tokenHash},data:{expiresAt:new Date(0)}});assert.equal((await fetch(control+artifact.url,{headers})).status,404);
 const account=await fetch(`${control}/api/admin/account`,{method:'POST',headers,body:JSON.stringify({action:'OTHER_SESSIONS',currentPassword:'wrong synthetic password',currentSecret:'wrong synthetic secret'})});assert.equal(account.status,401);
 console.log('PASS browser direct photo submission, exact stored Unicode, private attachment auth, archived originals/derivatives denied at both origins, private export expiry and account reauthentication denial.');
 await writeFile(`${evidence}/results.json`,JSON.stringify({publicEvidence:'public-layout.json',phase,results,consoleErrors:connection.errors},null,2));
 console.log('PASS exact origin, anonymous denial, stale task save, private product media, multilingual contact receipt replay.');
}finally{await writeFile(`${evidence}/last-run.json`,JSON.stringify({results,consoleErrors:connection?.errors},null,2));await database.$disconnect();connection?.socket.close();chrome.kill();await rm(profile,{recursive:true,force:true}).catch(()=>{});}
