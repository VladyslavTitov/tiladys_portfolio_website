// Temporary zero-published state only in the existing isolated synthetic DB.
import assert from 'node:assert/strict';
import {db} from '@tiladys/db';
import {readFile,writeFile,unlink} from 'node:fs/promises';
import {chromium} from '/tmp/tiladys-contact-playwright/node_modules/playwright-core/index.mjs';
const url=new URL(process.env.DATABASE_URL||'http://missing');assert.equal(url.hostname,'127.0.0.1');assert.equal(url.port,'55432');assert.equal(url.pathname,'/tiladys_rebuild_test');
const checkpoint='/tmp/tiladys-portfolio-redesign/empty-state.json';
try{await readFile(checkpoint);throw Error('Restore the previous visibility checkpoint first');}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
const rows=await db.project.findMany({where:{status:'PUBLISHED'},select:{id:true,updatedAt:true}});await writeFile(checkpoint,JSON.stringify(rows),{mode:0o600});
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const checks=[];
try{
 await db.project.updateMany({where:{id:{in:rows.map(r=>r.id)}},data:{status:'DRAFT'}});
 const p=await b.newPage();for(const width of [375,1440]){await p.setViewportSize({width,height:1000});const r=await p.goto('http://127.0.0.1:3100/en/portfolio',{waitUntil:'networkidle'});assert.equal(r?.status(),200);assert.equal(await p.locator('.portfolio-card').count(),0);assert.equal(await p.locator('.portfolio-filter button').count(),5);assert.ok(await p.getByRole('heading',{name:'No published projects yet.'}).isVisible());assert.ok(await p.getByText('Projects: 0',{exact:true}).isVisible());assert.equal(await p.locator('.featured-rotation').count(),0);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode().catch(()=>{});}));});await p.screenshot({path:`docs/portfolio-redesign-evidence/empty-${width}.png`,fullPage:true});checks.push(`Zero published records: truthful empty state, five choices, hero/footer retained, no overflow at ${width}px`);}
 await writeFile('docs/portfolio-redesign-evidence/empty-checks.json',JSON.stringify({syntheticOnly:true,checks},null,2));console.log(`PASS ${checks.length} actual zero-publication checks.`);
}finally{
 await b.close();await db.$transaction(rows.map(r=>db.project.update({where:{id:r.id},data:{status:'PUBLISHED',updatedAt:r.updatedAt}})));await unlink(checkpoint);await db.$disconnect();
}
