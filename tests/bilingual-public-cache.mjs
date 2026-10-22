import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'node:fs';
const url=process.env.CRM_TEST_DATABASE_URL; if(!url)throw Error('CRM_TEST_DATABASE_URL required');const target=new URL(url);assert.ok(['localhost','127.0.0.1'].includes(target.hostname));assert.equal(target.port,'55434');assert.equal(target.pathname,'/tiladys_crm_test');const db=new PrismaClient({datasourceUrl:url});
const page='http://127.0.0.1:3100/en/services/pc-laptop';const original=await db.priceItem.findUniqueOrThrow({where:{code:'E01'}});const marker='9876.54 €';const started=Date.now();
try {
 assert.equal((await fetch(page)).status,200);
 await db.priceItem.update({where:{id:original.id},data:{price:marker}});
 const publicData=await (await fetch('http://127.0.0.1:3101/api/public/prices')).json();assert.ok(JSON.stringify(publicData).includes(marker));
 let updated=false;
 for(let i=0;i<18;i++){const body=await (await fetch(page)).text();if(body.includes('9.876,54')||body.includes('9,876.54')||body.includes('9876.54')){updated=true;break;}await new Promise(resolve=>setTimeout(resolve,5000));}
 assert.ok(updated,'Public price cache must refresh after its 60-second TTL');
 const result={publicApiUpdatedImmediately:true,publicPageUpdated:true,elapsedMs:Date.now()-started,policy:'60-second stale-while-revalidate; first request after expiry triggers refresh'};
 writeFileSync('docs/business-control/samples/bilingual-review/cache-results.json',JSON.stringify(result,null,2));console.log(result);
} finally {await db.priceItem.update({where:{id:original.id},data:{price:original.price}});await db.$disconnect();}
