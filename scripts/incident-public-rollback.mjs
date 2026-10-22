// User-approved public-only rollback, 2026-10-21. No DB writes, env updates or builds.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {PrismaClient} from '@prisma/client';
import {api,mapping,cli,team,summary} from './incident-portfolio-inspect.mjs';
import {catalog} from './recovery-common.mjs';

export const recoveryEvidence='docs/recovery/2026-10-21/evidence/approved-recovery';
export const publicId='prj_JWa4iXqzV70GdY3TKDDL2Q5poRRv';
export const controlId='prj_6YJMTiWWHE0lX8nzUYCUpA82tEvV';
export const approvedTarget='dpl_5B38LjUBUFpAGnfS3whyHVG9qmJx';
export const expectedCurrent='dpl_R2D4fuBc7MKSpc3CCqjuho1xjrmz';
const candidate='https://tiladys-public-21zujdkfm-tiladys.vercel.app';
const secrets=[];
export const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const envMetadata=envs=>JSON.parse(JSON.stringify(envs.map(e=>({id:e.id,key:e.key,type:e.type,target:e.target,gitBranch:e.gitBranch,customEnvironmentIds:e.customEnvironmentIds,createdAt:e.createdAt,updatedAt:e.updatedAt})).sort((a,b)=>a.id.localeCompare(b.id))));
export function protection(project){const {ssoProtection,passwordProtection,trustedIps,optionsAllowlist,autoExposeSystemEnvs}=project;return JSON.parse(JSON.stringify({ssoProtection,passwordProtection,trustedIps,optionsAllowlist,autoExposeSystemEnvs}));}
export async function snapshot(db){
  const schema=await catalog(db);
  const result=await db.$transaction(async tx=>{
    await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
    const identity=await tx.$queryRawUnsafe(`SELECT current_database() AS database,current_schema() AS schema,current_user AS role,current_setting('server_version') AS version`);
    const ledger=await tx.$queryRawUnsafe('SELECT migration_name,checksum,finished_at,rolled_back_at,applied_steps_count FROM "_prisma_migrations" ORDER BY migration_name');
    const fingerprints=[];
    for(const {tablename}of schema.tables){const q='"'+tablename.replaceAll('"','""')+'"';const [row]=await tx.$queryRawUnsafe(`SELECT count(*)::text AS count,md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'' ORDER BY md5(to_jsonb(t)::text)),'')) AS fingerprint FROM ${q} t`);fingerprints.push({table:tablename,...row});}
    const published=await tx.$queryRawUnsafe(`SELECT slug,category,title->>'en' AS title FROM "Project" WHERE status='PUBLISHED' ORDER BY "sortOrder","updatedAt" DESC`);
    const images=await tx.$queryRawUnsafe(`SELECT i.id,p.slug FROM "ProjectImage" i JOIN "Project" p ON p.id=i."projectId" WHERE p.status='PUBLISHED' ORDER BY p.slug,i."sortOrder"`);
    return{identity,ledger,fingerprints,published,images};
  },{isolationLevel:'RepeatableRead',timeout:60000});
  return{schema,...result};
}
export async function browserChecks(origin,{token,records,screenshots=false}={}){
  const {chromium}=await import(pathToFileURL('/tmp/tiladys-contact-playwright/node_modules/playwright-core/index.mjs').href);
  const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
  try{
    const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
    if(token)await context.route('**/*',route=>route.continue({headers:{...route.request().headers(),...(new URL(route.request().url()).origin===origin?{'x-vercel-protection-bypass':token}:{})}}));
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    const result={origin,checkedAt:new Date().toISOString(),navigation:[],details:[],media:[]};
    for(const pathname of ['/en/portfolio','/en','/en/services','/en/about','/en/contact','/en/prices','/en/privacy','/en/terms','/en/impressum']){
      const response=await page.goto(origin+pathname,{waitUntil:'networkidle',timeout:60000});assert.equal(response.status(),200,'Critical public page failed: '+pathname);
      assert.equal(await page.locator('h1').count(),1,'Missing public heading: '+pathname);
      assert.equal(await page.locator('.portfolio-error').count(),0,'Portfolio unavailable');
      result.navigation.push({pathname,status:response.status(),finalUrl:page.url(),heading:await page.locator('h1').innerText()});
      if(pathname==='/en/portfolio'){
        result.portfolioCards=await page.locator('.portfolio-card').count();assert.equal(result.portfolioCards,7);
        // Scroll every card into view so lazy images are exercised before inspection.
        for(const image of await page.locator('.portfolio-card img').all())await image.scrollIntoViewIfNeeded();
        await page.waitForFunction(()=>[...document.querySelectorAll('.portfolio-card img')].every(i=>i.complete&&i.naturalWidth>0),null,{timeout:20000});
        result.cardImages=await page.locator('.portfolio-card img').evaluateAll(items=>items.map(i=>({loaded:i.complete&&i.naturalWidth>0})));assert.ok(result.cardImages.every(i=>i.loaded));
        result.filterTabs=await page.getByRole('tab').allTextContents();
        if(screenshots){await mkdir(recoveryEvidence+'/browser',{recursive:true});await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:recoveryEvidence+'/browser/live-portfolio.png',fullPage:true});}
      }
      if(pathname==='/en/contact'){
        assert.equal(await page.locator('#contact-form').count(),1);
        const invalid=await page.locator('#contact-form').evaluate(f=>({valid:f.checkValidity(),required:[...f.querySelectorAll('[required]')].map(i=>i.name)}));assert.equal(invalid.valid,false);
        assert.ok(['name','email','message','consent'].every(n=>invalid.required.includes(n)));
        let requests=0;const listener=req=>{if(new URL(req.url()).pathname==='/api/contact')requests++;};page.on('request',listener);await page.locator('#contact-form button[type=submit]').click();assert.equal(requests,0,'Empty form must be stopped by client validation');page.off('request',listener);
        result.contact={rendered:true,required:invalid.required,emptySubmissionBlocked:true,realEnquirySubmitted:false};
        const linkPaths=await page.locator('a[href]').evaluateAll(links=>links.map(l=>l.getAttribute('href')).filter(h=>h?.startsWith('/en/')));result.publicNavigationLinks=[...new Set(linkPaths)];
      }
    }
    const headers=token?{'x-vercel-protection-bypass':token}:{};
    for(const p of records.published){const response=await context.request.get(origin+'/en/portfolio/'+p.slug,{headers,maxRedirects:0,timeout:45000});assert.equal(response.status(),200,'Project detail failed: '+p.slug);const html=await response.text();const title=await page.evaluate(html=>new DOMParser().parseFromString(html,'text/html').querySelector('h1')?.textContent,html);assert.equal(title,p.title,'Project title failed: '+p.slug);result.details.push({url:origin+'/en/portfolio/'+p.slug,status:response.status(),title});}
    for(const image of records.images){const url=origin+'/api/public/media/'+image.id+'?w=120';const response=await context.request.get(url,{headers,maxRedirects:0,timeout:45000});assert.equal(response.status(),200,'Project media failed');const type=response.headers()['content-type'];assert.ok(type?.startsWith('image/'));const bytes=(await response.body()).length;assert.ok(bytes>0);result.media.push({url,status:response.status(),contentType:type,bytes});}
    // These probes return before rate limiting, body parsing or persistence.
    const badType=await context.request.post(origin+'/api/contact',{headers:{...headers,origin,'content-type':'text/plain'},data:'invalid',maxRedirects:0});assert.equal(badType.status(),415);
    const badOrigin=await context.request.post(origin+'/api/contact',{headers:{...headers,origin:'https://example.invalid','content-type':'application/json'},data:'{}',maxRedirects:0});assert.equal(badOrigin.status(),403);
    result.contact.unsupportedContentType=badType.status();result.contact.untrustedOrigin=badOrigin.status();result.contact.persistenceAndEmailDeliveryTested=false;
    result.browserErrors=errors;assert.equal(errors.length,0,'Browser exception in critical public page');return result;
  }finally{await browser.close();}
}
async function main(){
  assert.equal(process.argv[2],'--approved-public-rollback','Explicit approved mode required');await mkdir(recoveryEvidence,{recursive:true});
  const marker=recoveryEvidence+'/rollback-attempt.json';try{await readFile(marker);throw new Error('Rollback already attempted; do not repeat');}catch(e){if(e.code!=='ENOENT')throw e;}
  const project=api('/v9/projects/'+publicId),control=api('/v9/projects/'+controlId),target=api('/v13/deployments/'+approvedTarget);
  assert.equal(project.accountId,team);assert.equal(project.name,'tiladys-public');assert.equal(project.rootDirectory,'apps/web');assert.equal(project.targets.production.id,expectedCurrent,'Production target changed; STOP');
  assert.equal(control.targets.production.id,'dpl_29sUx2PbwBzRu3UUNbmBZE6aoBVn','Control Production changed; STOP');
  assert.equal(target.projectId,publicId);assert.equal(target.target,'production');assert.equal(target.readyState,'READY');assert.equal(target.meta.githubCommitSha,'e82bff04aac9915585b10cc853fe31c558a5964b');assert.equal('https://'+target.url,candidate);
  const tokenEntries=Object.entries(project.protectionBypass||{}).filter(([,m])=>m.scope==='automation-bypass'&&m.createdAt===1792596609679);assert.equal(tokenEntries.length,1,'Exact inspection access changed; STOP');const token=tokenEntries[0][0];secrets.push(token);
  const previous=JSON.parse(await readFile('docs/recovery/2026-10-21/evidence/portfolio-login/deployments-and-mappings.json','utf8'));
  const mappings=await mapping(publicId,'production');const direct=mappings.find(e=>e.entry.key==='DATABASE_URL_UNPOOLED').url;for(const e of mappings){secrets.push(e.url.href,e.url.password,decodeURIComponent(e.url.password));assert.ok(!e.entry.gitBranch);}
  assert.equal(direct.hostname,'ep-frosty-hall-a2rder07.eu-central-1.aws.neon.tech');assert.equal(direct.pathname,'/neondb');assert.equal(direct.searchParams.get('schema')||'public','public');
  assert.deepEqual(JSON.parse(JSON.stringify(mappings.map(e=>({...e.entry,...e.identity})))),previous.projects.find(p=>p.projectId===publicId).mappings.find(m=>m.target==='production').entries,'Production database mapping changed; STOP');
  const publicEnv=envMetadata(api('/v10/projects/'+publicId+'/env').envs),controlEnv=envMetadata(api('/v10/projects/'+controlId+'/env').envs);
  const db=new PrismaClient({datasourceUrl:direct.href,log:[]});
  try{
    const before=await snapshot(db);assert.equal(before.ledger.length,13);assert.equal(before.published.length,7);assert.equal(before.images.length,27);
    const baseline=JSON.parse(await readFile('docs/recovery/2026-10-21/evidence/portfolio-login/tiladys-public-production-database.json','utf8')).schema;
    for(const key of ['tables','columns','enums','constraints','indexes'])assert.deepEqual(before.schema[key],baseline[key],'Production schema changed: '+key);
    const checksums=JSON.parse(await readFile('docs/recovery/2026-10-21/evidence/migration-file-checksums.json','utf8')).slice(0,13);
    for(let i=0;i<13;i++){assert.equal(before.ledger[i].migration_name,checksums[i].name);assert.equal(before.ledger[i].checksum,checksums[i].sha256);assert.ok(before.ledger[i].finished_at&&!before.ledger[i].rolled_back_at);}
    const prior=JSON.parse(await readFile('docs/recovery/2026-10-21/evidence/portfolio-login/compatibility.json','utf8')).records;
    assert.deepEqual(before.published,prior.published);for(const row of prior.fingerprints)assert.deepEqual(before.fingerprints.find(f=>f.table===row.table),row,'Business/media data changed; STOP');
    const old=spawnSync('git',['show','e82bff04aac9915585b10cc853fe31c558a5964b:packages/db/prisma/schema.prisma'],{encoding:'utf8'});assert.equal(old.status,0);await writeFile('/tmp/tiladys-approved-compatible-schema.prisma',old.stdout);
    const diff=spawnSync(process.execPath,['node_modules/prisma/build/index.js','migrate','diff','--from-schema-datasource','packages/db/prisma/schema.prisma','--to-schema-datamodel','/tmp/tiladys-approved-compatible-schema.prisma','--exit-code'],{env:{...process.env,DATABASE_URL:direct.href},encoding:'utf8',timeout:90000});assert.equal(diff.status,0,'Full Prisma compatibility precondition changed; STOP');
    const critical=await browserChecks(candidate,{token,records:before});await writeFile(recoveryEvidence+'/candidate-reverification.json',JSON.stringify(critical,null,2));
    // Immediately recheck the target, environment metadata and database after HTTP checks.
    const fresh=api('/v9/projects/'+publicId),freshTarget=api('/v13/deployments/'+approvedTarget),freshControl=api('/v9/projects/'+controlId);
    assert.equal(fresh.targets.production.id,expectedCurrent);assert.equal(freshTarget.readyState,'READY');assert.equal(freshTarget.meta.githubCommitSha,target.meta.githubCommitSha);assert.equal(freshControl.targets.production.id,control.targets.production.id);
    assert.deepEqual(envMetadata(api('/v10/projects/'+publicId+'/env').envs),publicEnv);assert.deepEqual(envMetadata(api('/v10/projects/'+controlId+'/env').envs),controlEnv);
    const immediate=await snapshot(db);assert.deepEqual(immediate,before,'Database changed during preflight; STOP');
    const evidence={checkedAt:new Date().toISOString(),projectId:publicId,teamId:team,target:summary(freshTarget),previous:summary(fresh.targets.production),controlProduction:summary(freshControl.targets.production),publicEnv,controlEnv,publicProtection:protection(project),controlProtection:protection(control),publicTokenMetadata:Object.values(project.protectionBypass||{}),controlTokenMetadata:Object.values(control.protectionBypass||{}),before,fullPrismaDiffEmpty:true,criticalFunctionsReverified:true};
    await writeFile(recoveryEvidence+'/rollback-preconditions.json',JSON.stringify(evidence,null,2));
    await writeFile(marker,JSON.stringify({startedAt:new Date().toISOString(),target:approvedTarget,projectId:publicId,userApproval:'2026-10-21 Action 1, public-only rollback'},null,2),{flag:'wx'});
    console.log('All rollback preconditions passed immediately before execution. Performing the approved public-only rollback.');
    const rollback=spawnSync(process.execPath,[cli,'rollback',approvedTarget,'--scope',team,'--yes','--timeout','60s','--non-interactive'],{cwd:'/tmp/tiladys-incident-public',encoding:'utf8',timeout:90000,maxBuffer:8*1024*1024});
    await writeFile(recoveryEvidence+'/rollback-command.log',(rollback.stdout||'')+(rollback.stderr||''));assert.equal(rollback.status,0,'Rollback result uncertain; inspect status, do not retry');
    await writeFile(recoveryEvidence+'/rollback-result.json',JSON.stringify({completedAt:new Date().toISOString(),exitCode:rollback.status,approvedTarget,projectId:publicId,newBuild:false,databaseWrites:false,environmentUpdates:false,controlChanges:false},null,2));console.log('Approved rollback command completed. Live alias verification is required next.');
  }finally{await db.$disconnect();}
}
if(process.argv[1]?.endsWith('/incident-public-rollback.mjs'))main().catch(async error=>{let detail=String(error.stack||error);for(const secret of secrets.filter(Boolean))detail=detail.split(secret).join('[REDACTED]');detail=detail.replace(/postgres(?:ql)?:\/\/[^\s]+/g,'[REDACTED]');await mkdir(recoveryEvidence,{recursive:true});await writeFile(recoveryEvidence+'/rollback-stopped.log',detail);console.error('ROLLBACK_STOPPED: inspect sanitized evidence; no automatic retry.');process.exitCode=1;});
