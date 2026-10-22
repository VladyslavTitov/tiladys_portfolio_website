// Hosted GET-only validation. Existing protection tokens stay in memory and are origin-scoped.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {PrismaClient} from '@prisma/client';
import {api,mapping,evidence} from './incident-portfolio-inspect.mjs';
const candidate='https://tiladys-public-21zujdkfm-tiladys.vercel.app';
const preview='https://tiladys-control-8pbtklpa3-tiladys.vercel.app';
const control='https://tiladys-control-i0v1ethdv-tiladys.vercel.app';
async function main(){
const entries=new Map(),security=[];
for(const [id,origins]of [['prj_JWa4iXqzV70GdY3TKDDL2Q5poRRv',[candidate]],['prj_6YJMTiWWHE0lX8nzUYCUpA82tEvV',[preview,control]]]){
const project=api('/v9/projects/'+id);const tokens=project.protectionBypass||{};const token=Object.keys(tokens).find(t=>tokens[t].scope==='automation-bypass');assert.ok(token,'Existing protection access required; never create a token here');for(const origin of origins)entries.set(origin,token);
security.push({projectId:id,protectionTokens:Object.values(tokens).map(t=>({scope:t.scope,createdAt:t.createdAt,createdBy:t.createdBy})),tokenCreatedByThisScript:false});}
await writeFile(evidence+'/protection-token-metadata.json',JSON.stringify(security,null,2));
const {chromium}=await import(pathToFileURL('/tmp/tiladys-contact-playwright/node_modules/playwright-core/index.mjs').href);
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
await context.route('**/*',async route=>{const request=route.request(),token=entries.get(new URL(request.url()).origin);await route.continue({headers:{...request.headers(),...(token?{'x-vercel-protection-bypass':token}:{})}});});
async function get(origin,path){const res=await context.request.get(origin+path,{headers:entries.has(origin)?{'x-vercel-protection-bypass':entries.get(origin)}:{},maxRedirects:0,timeout:45000});return res;}
const page=await context.newPage(),out={checkedAt:new Date().toISOString(),production:{},candidate:{},controlApis:[]};
await mkdir(evidence+'/browser',{recursive:true});
try{
const response=await page.goto('https://tiladys.com/en/portfolio',{waitUntil:'networkidle',timeout:60000});out.production={url:page.url(),status:response.status(),errorVisible:await page.locator('.portfolio-error').count()>0,cards:await page.locator('.portfolio-card').count()};await page.screenshot({path:evidence+'/browser/production-unavailable.png',fullPage:true});
const old=await page.goto(candidate+'/en/portfolio',{waitUntil:'networkidle',timeout:60000});out.candidate={url:page.url(),status:old.status(),cards:await page.locator('.portfolio-card').count(),errorVisible:await page.locator('.portfolio-error').count()>0,searchInputs:await page.locator('input[type=search]').count(),filters:[]};
assert.equal(out.candidate.cards,7);assert.equal(out.candidate.errorVisible,false);await page.screenshot({path:evidence+'/browser/rollback-candidate.png',fullPage:true});
for(const tab of await page.getByRole('tab').all()){const name=await tab.innerText();await tab.click();out.candidate.filters.push({name,cards:await page.locator('.portfolio-card').count(),selected:await tab.getAttribute('aria-selected')});}
await page.getByRole('tab').first().click();out.candidate.loadedImages=await page.locator('.portfolio-card img').evaluateAll(images=>images.map(i=>({loaded:i.complete&&i.naturalWidth>0})));
const records=JSON.parse(await readFile(evidence+'/compatibility.json','utf8')).records;out.candidate.details=[];for(const p of records.published){const r=await get(candidate,'/en/portfolio/'+p.slug);const html=await r.text();const title=await page.evaluate(html=>new DOMParser().parseFromString(html,'text/html').querySelector('h1')?.textContent,html);out.candidate.details.push({slug:p.slug,status:r.status(),containsTitle:title===p.title,errorPage:html.includes('Application error:')});}
out.candidate.media=[];for(const im of records.images){const r=await get(candidate,'/api/public/media/'+im.id+'?w=120');out.candidate.media.push({id:im.id,status:r.status(),contentType:r.headers()['content-type'],bytes:(await r.body()).length});}
const mapped=await mapping('prj_JWa4iXqzV70GdY3TKDDL2Q5poRRv','production');const db=new PrismaClient({datasourceUrl:mapped.find(e=>e.entry.key==='DATABASE_URL').url.href,log:[]});
try{const privateRows=await db.$transaction(async tx=>{await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');return tx.$queryRawUnsafe(`SELECT slug,status FROM "Project" WHERE status<>'PUBLISHED'`);});out.candidate.privateProjects=[];for(const p of privateRows){const r=await get(candidate,'/en/portfolio/'+p.slug);out.candidate.privateProjects.push({status:p.status,response:r.status()});}}finally{await db.$disconnect();}
for(const origin of [preview,control])for(const path of ['/api/admin/projects','/api/admin/customers','/api/admin/invoices','/api/admin/quotes']){const r=await get(origin,path);out.controlApis.push({origin,path,status:r.status()});}
await page.goto(preview+'/login',{waitUntil:'networkidle',timeout:60000});out.previewLogin={url:page.url(),form:await page.locator('form').count(),email:await page.locator('input[name=email]').count(),password:await page.locator('input[name=password]').count(),secretPhrase:await page.locator('input[name=secretWord]').count()};await page.screenshot({path:evidence+'/browser/preview-login.png',fullPage:true});
await writeFile(evidence+'/hosted-validation.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));
}finally{await browser.close();}}
main().catch(()=>{console.error('HOSTED_READONLY_VALIDATION_FAILED; credentials and private details withheld');process.exitCode=1;});
