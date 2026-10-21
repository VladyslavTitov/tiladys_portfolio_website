// Exercise the unchanged dashboard using only task-owned synthetic records.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {chromium} from '/tmp/tiladys-contact-playwright/node_modules/playwright-core/index.mjs';
const fixture=JSON.parse(await readFile('/tmp/tiladys-portfolio-redesign/fixtures.json','utf8'));
const row=fixture.records.find(r=>r.slug.endsWith('-draft'));
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
const context=await b.newContext();await context.addCookies([{name:'tiladys_session',value:fixture.token,domain:'127.0.0.1',path:'/',httpOnly:true,sameSite:'Strict'},{name:'control_locale',value:'en',domain:'127.0.0.1',path:'/'}]);
const p=await context.newPage(),checks=[];const origin='http://127.0.0.1:3101';
try{
 await p.setViewportSize({width:1440,height:1000});await p.goto(`${origin}/dashboard/projects`,{waitUntil:'networkidle'});assert.ok(!p.url().includes('/login'));
 await p.getByLabel('Search projects',{exact:true}).fill(row.slug);
 const choice=p.locator('.project-admin-list').getByRole('button').filter({hasText:'Private needle DRAFT'});await choice.waitFor();await choice.click();
 const title=p.getByLabel('Title (EN)',{exact:true});await title.fill('EN · Private needle DRAFT — editor saved');await p.getByLabel('Feature on home page',{exact:true}).check();
 await p.getByRole('group',{name:'Project translation language'}).getByRole('button',{name:'DE',exact:true}).click();await p.getByLabel('Title (DE)',{exact:true}).fill('DE · Privater Test — gespeichert');await p.getByRole('group',{name:'Project translation language'}).getByRole('button',{name:'EN',exact:true}).click();assert.equal(await title.inputValue(),'EN · Private needle DRAFT — editor saved');
 const saveRequest=p.waitForRequest(r=>r.method()==='PATCH'&&r.url().endsWith(`/api/admin/projects/${row.id}`));const saveResponse=p.waitForResponse(r=>r.request().method()==='PATCH'&&r.url().endsWith(`/api/admin/projects/${row.id}`));
 await p.getByRole('button',{name:'Save private draft',exact:true}).click();await p.waitForFunction(()=>document.querySelector('.project-save-message')?.textContent.startsWith('Project saved.'));
 const sent=(await saveRequest).postDataJSON();const payload=sent.payload||sent;let saved=await (await saveResponse).json();assert.equal(saved.title.en,'EN · Private needle DRAFT — editor saved');assert.equal(saved.title.de,'DE · Privater Test — gespeichert');assert.equal(saved.homepageFeatured,true);assert.equal(saved.status,'DRAFT');
 checks.push('Actual dashboard title/localization editing saves a private draft and preserves the home-featured flag.');
 let response=await p.request.patch(`${origin}/api/admin/projects/${row.id}`,{headers:{Origin:origin},data:{payload,expectedUpdatedAt:saved.updatedAt}});assert.equal(response.status(),200);
 saved=await response.json();response=await p.request.patch(`${origin}/api/admin/projects/${row.id}`,{headers:{Origin:origin},data:{payload:{...payload,status:'PUBLISHED'},expectedUpdatedAt:saved.updatedAt}});assert.equal(response.status(),422);assert.equal((await response.json()).error,'PUBLICATION_REVIEW_REQUIRED');checks.push('The unchanged handler rejects publication without explicit review.');
 await p.reload({waitUntil:'networkidle'});await p.getByLabel('Search projects',{exact:true}).fill(row.slug);await p.locator('.project-admin-list').getByRole('button').filter({hasText:'editor saved'}).click();
 await p.getByLabel('I reviewed the public text, media rights and confidentiality.',{exact:true}).check();p.once('dialog',async dialog=>{assert.match(dialog.message(),/Publish the reviewed project/);await dialog.accept();});const publishResponse=p.waitForResponse(r=>r.request().method()==='PATCH'&&r.url().endsWith(`/api/admin/projects/${row.id}`));await p.getByRole('button',{name:'Publish reviewed project',exact:true}).click();await p.waitForFunction(()=>document.querySelector('.project-save-message')?.textContent.startsWith('Project saved.'));
 saved=await (await publishResponse).json();assert.equal(saved.status,'PUBLISHED');assert.equal(saved.homepageFeatured,true);
 response=await p.request.get(`http://127.0.0.1:3100/en/portfolio/${row.slug}`);assert.equal(response.status(),200);await p.screenshot({path:'docs/portfolio-redesign-evidence/editor-reviewed.png',fullPage:true});checks.push('Actual reviewed-publication UI still publishes the synthetic project and its unchanged detail URL becomes available.');
 response=await p.request.patch(`${origin}/api/admin/projects/${row.id}`,{headers:{Origin:origin},data:{payload:{...payload,status:'DRAFT'},expectedUpdatedAt:saved.updatedAt}});assert.equal(response.status(),200);response=await p.request.get(`http://127.0.0.1:3100/api/public/media/${row.images[0].id}?w=384`);assert.equal(response.status(),404);checks.push('Withdrawing that same test project returns its derivative media to private status.');
 await writeFile('docs/portfolio-redesign-evidence/editor-checks.json',JSON.stringify({syntheticOnly:true,checks},null,2));console.log(JSON.stringify({passed:checks.length,checks}));
}finally{await b.close();}
