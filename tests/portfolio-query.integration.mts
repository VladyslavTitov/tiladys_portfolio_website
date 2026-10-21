import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {db} from '@tiladys/db';
import {getPublishedPortfolio} from '../apps/web/lib/public-projects-db';
import {publicPortfolioCategory} from '../apps/web/lib/portfolio-filters';
const url=new URL(process.env.DATABASE_URL||'http://missing');assert.equal(url.hostname,'127.0.0.1');assert.equal(url.port,'55432');assert.equal(url.pathname,'/tiladys_rebuild_test');
await readFile('/tmp/tiladys-portfolio-redesign/fixtures.json');const checks=[];
try{
 for(const locale of ['en','de','fr','sk','uk','ru']){
  const published=await db.project.findMany({where:{status:'PUBLISHED'},select:{id:true,category:true,title:true,summary:true}});
  const eligible=published.filter(p=>{const title=p.title as Record<string,string>,summary=p.summary as Record<string,string>;return title[locale]?.trim()&&summary[locale]?.trim();});
  for(const filter of ['all','websites','services','3d-printing','linux-servers']){
   const expected=eligible.filter(p=>filter==='all'||publicPortfolioCategory(p.category)===filter);const result=await getPublishedPortfolio(locale,{filter});assert.equal(result.total,expected.length);assert.ok(result.projects.length<=12);assert.ok(result.projects.every(p=>expected.some(e=>e.id===p.id)));
   for(const p of result.projects){assert.ok(p.images.length<=1);for(const key of ['description','seoTitle','workItems','homepageFeatured','clientName'])assert.equal(key in p,false);for(const im of p.images)assert.equal('data' in im,false);}
   if(expected.length>12){const second=await getPublishedPortfolio(locale,{filter,page:'2'});assert.ok(second.projects.length);assert.ok(second.projects.every(p=>!result.projects.some(first=>first.id===p.id)));}
   checks.push(`${locale}: ${filter} actual counts, publication, bounded slim projection and paging`);
  }
  assert.equal((await getPublishedPortfolio(locale,{filter:'websites',q:'Needle'})).total,1);assert.equal((await getPublishedPortfolio(locale,{q:'100%_done'})).total,1);assert.equal((await getPublishedPortfolio(locale,{q:"' OR 1=1 --"})).total,0);assert.equal((await getPublishedPortfolio(locale,{filter:'services',q:'Needle'})).total,0);checks.push(`${locale}: combined localized search, literal wildcard characters, injection text and empty state`);
 }
 for(const query of [{category:'digital-support'},{filter:'digital'},{category:'legacy-unclassified'}])assert.equal((await getPublishedPortfolio('en',query)).filter,'services');
 for(const page of ['-3','NaN','Infinity'])assert.equal((await getPublishedPortfolio('en',{page})).page,1);
 await writeFile('docs/portfolio-redesign-evidence/query-checks.json',JSON.stringify({syntheticOnly:true,checks},null,2));console.log(`PASS ${checks.length} database query groups plus legacy URL and invalid-page checks.`);
}finally{await db.$disconnect();}
