// Bounded localhost-only authorization/SEO regression. Never contacts production links.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {PrismaClient} from '@prisma/client';
import crypto from 'node:crypto';
const u=new URL(process.env.DATABASE_URL||'http://missing');assert.equal(u.origin,'null');assert.equal(u.hostname,'127.0.0.1');assert.equal(u.port,'55432');assert.equal(u.pathname,'/tiladys_rebuild_test');
const f=JSON.parse(await readFile('/tmp/tiladys-complete-qa/fixtures.json','utf8')),inventory=JSON.parse(await readFile('docs/qa/evidence/inventory.json','utf8'));
const control='http://127.0.0.1:3101',web='http://127.0.0.1:3100',db=new PrismaClient(),rows=[];
const check=(id,ok,details={})=>rows.push({id,status:ok?'PASS':'FAIL',...details});
const privatePaths=inventory.routes.filter(r=>r.app==='control'&&r.path.startsWith('/api/admin'));
try{
 for(const r of privatePaths)for(const method of r.methods){
  const path=r.path.replaceAll('[id]','qa-missing').replaceAll('[imageId]','qa-missing').replaceAll('[attachmentId]','qa-missing').replaceAll('[token]','qa-missing');
  const res=await fetch(control+path,{method,headers:{origin:control,'Content-Type':'application/json'},body:['POST','PUT','PATCH','DELETE'].includes(method)?'{}':undefined,redirect:'manual'});const text=await res.text();
  check(`AUTH-ANON ${method} ${r.path}`,res.status===401&&!text.includes('PrismaClient')&&/no-store/.test(res.headers.get('cache-control')||''),{http:res.status});
 }
 for(const r of inventory.routes.filter(r=>r.app==='control'&&r.methods[0]==='PAGE'&&r.path.startsWith('/dashboard'))){
  const path=r.path.replaceAll('[id]','qa-missing').replace('[section]','account');
  for(const cookie of ['', 'tiladys_session=missing-qa-session']){
   const res=await fetch(control+path,{headers:{cookie},redirect:'manual'}),text=await res.text();
   check(`AUTH-PAGE ${path} ${cookie?'stale':'missing'}`,[302,303,307,308].includes(res.status)&&res.headers.get('location')==='/login'&&!text.includes('UNAUTHORIZED'),{http:res.status});
  }
 }
 const headers={origin:control,'Content-Type':'application/json'},login=await fetch(control+'/api/auth/login',{method:'POST',headers,body:JSON.stringify({email:f.email,password:f.password,secretWord:f.secretWord})});
 const cookie=login.headers.get('set-cookie')||'',token=cookie.match(/tiladys_session=([^;]+)/)?.[1];assert.ok(token);
 check('AUTH-REAL-LOGIN',login.status===200&&/httponly/i.test(cookie)&&/secure/i.test(cookie)&&/samesite=strict/i.test(cookie));
 await db.session.update({where:{tokenHash:crypto.createHash('sha256').update(token).digest('hex')},data:{expiresAt:new Date(0)}});
 const expired=await fetch(control+'/dashboard',{headers:{cookie:`tiladys_session=${token}`},redirect:'manual'});check('AUTH-EXPIRED-PAGE',expired.status===307&&expired.headers.get('location')==='/login'&&!(await expired.text()).includes('UNAUTHORIZED'));
 const expiredAPI=await fetch(control+'/api/admin/customers',{headers:{cookie:`tiladys_session=${token}`}});check('AUTH-EXPIRED-API',expiredAPI.status===401);
 for(const [path,body] of [['/api/auth/login',{}],['/api/auth/logout',{}],['/api/admin/tasks',{title:'QA should never save'}]]){
  const res=await fetch(control+path,{method:'POST',headers:{...headers,origin:'https://evil.example.test',cookie:`tiladys_session=${f.token}`},body:JSON.stringify(body),redirect:'manual'});check(`CSRF ${path}`,res.status===403,{http:res.status});
 }
 const routes=['','/about','/contact','/portfolio','/services','/services/websites','/services/pc-laptop','/services/3d-printing','/services/business-it','/products/framer','/products/3d-models','/impressum','/privacy','/terms',`/portfolio/${f.records[0].slug}`,`/products/${f.publicProductSlug}`];
 for(const locale of ['en','de','uk','ru','sk','fr'])for(const route of routes){
  const res=await fetch(`${web}/${locale}${route}`),html=await res.text(),canonical=html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
  const meaningful=res.status===200&&/<h1[ >]/.test(html)&&!html.includes('Projects are temporarily unavailable')&&!html.includes('NEXT_HTTP_ERROR_FALLBACK;500');
  const localized=html.includes(`<html lang="${locale}"`)&&canonical?.endsWith(`/${locale}${route}`)&&/<title>[^<]+<\/title>/.test(html)&&/name="description"/.test(html);
  const hreflang=['en','de','uk','ru','sk','fr'].every(l=>new RegExp(`hreflang="${l}"`,'i').test(html));
  check(`PUBLIC ${locale}${route||'/'}`,meaningful&&localized&&hreflang,{http:res.status,canonical,meaningful,localized,hreflang,ogImage:/property="og:image"/.test(html)});
 }
 for(const locale of ['en','de','uk','ru','sk','fr']){
  for(const [from,to] of [['prices','services'],['services/network-wifi','services/business-it'],['services/it-support-diagnostics','services/pc-laptop']]){const res=await fetch(`${web}/${locale}/${from}`,{redirect:'manual'});check(`REDIRECT ${locale}/${from}`,res.status===308&&res.headers.get('location')?.endsWith(`/${locale}/${to}`));}
 }
 for(const p of [f.records.find(r=>r.slug.endsWith('-draft')),f.records.find(r=>r.slug.endsWith('-archived'))]){
  for(const path of [`/en/portfolio/${p.slug}`,`/api/public/media/${p.images[0].id}`,`/api/public/media/${p.images[0].id}?w=320`]){const res=await fetch(web+path);check(`PRIVATE-PUBLIC ${path}`,res.status===404,{http:res.status});}
 }
 const privateProduct=await fetch(web+'/api/public/product-media/'+f.privateProductImage);check('PRIVATE-PRODUCT-MEDIA',privateProduct.status===404&&/no-store/.test(privateProduct.headers.get('cache-control')||''));
 const sitemap=await fetch(web+'/sitemap.xml'),xml=await sitemap.text();check('SEO-SITEMAP',sitemap.status===200&&!/\/dashboard|\/api\//.test(xml)&&!xml.includes('-draft')&&!xml.includes('-archived'));
 const robots=await fetch(web+'/robots.txt');check('SEO-ROBOTS',robots.status===200);
 const missing=await fetch(web+'/en/qa-definitely-missing');check('PUBLIC-404',missing.status===404);
 for(const origin of [web,control]){const res=await fetch(origin+(origin===web?'/en':'/login'));check(`HEADERS ${origin}`,res.headers.get('x-frame-options')==='DENY'&&res.headers.get('x-content-type-options')==='nosniff'&&res.headers.get('content-security-policy')?.includes("frame-ancestors 'none'")&&!res.headers.get('content-security-policy')?.includes('unsafe-eval'));}
}finally{await db.$disconnect();await writeFile('docs/qa/evidence/http.json',JSON.stringify({rows},null,2));}
const failures=rows.filter(r=>r.status==='FAIL');console.log(JSON.stringify({checks:rows.length,failures},null,2));assert.equal(failures.length,0);
