import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {PrismaClient} from '@prisma/client';
import {browserDriver} from './browser-protocol.mjs';
const url=new URL(process.env.DATABASE_URL||'http://missing');
assert.equal(url.hostname,'127.0.0.1');assert.equal(url.port,'55432');assert.equal(url.pathname,'/tiladys_rebuild_test');
const db=new PrismaClient(),rows=[],b=await browserDriver(false,9342);
try {
 assert.equal(await db.project.count({where:{status:'PUBLISHED'}}),0);assert.equal(await db.product.count({where:{status:'PUBLISHED'}}),0);
 for(const route of ['','/portfolio','/services/websites','/services/3d-printing','/products/framer','/products/3d-models']){
  await b.viewport(1440);await b.navigate(`http://127.0.0.1:3100/en${route}`);
  const state=await b.evaluate(`({placeholder:/QA evidence only|Synthetic (?:template|.* project)/.test(document.querySelector('main').textContent),projectCards:document.querySelectorAll('.portfolio-card,.featured-project').length,empty:document.body.textContent.includes('No published items are available here yet.')||!!document.querySelector('.empty-state'),unavailable:document.body.textContent.includes('The catalogue could not be loaded.')})`);
  assert.equal(state.placeholder,false);assert.equal(state.projectCards,0);assert.equal(state.unavailable,false);assert.equal(state.empty,true);rows.push({route,...state});
 }
}finally{await writeFile('docs/ui-evidence/empty-catalogue/visibility.json',JSON.stringify({syntheticOnly:true,productionTestFixture:'zero published records; real publication projection unchanged',rows},null,2));await b.close();await db.$disconnect();}
console.log(JSON.stringify({passed:rows.length}));
