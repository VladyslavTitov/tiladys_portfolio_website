import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
const url = process.env.CRM_TEST_DATABASE_URL; if (!url) throw Error('CRM_TEST_DATABASE_URL required');
const parsed = new URL(url); assert.ok(['localhost','127.0.0.1'].includes(parsed.hostname)); assert.equal(parsed.port,'55434'); assert.equal(parsed.pathname,'/tiladys_crm_test');
const db = new PrismaClient({ datasourceUrl:url }); const base='http://127.0.0.1:3101';
const output='docs/business-control/samples/bilingual-review'; mkdirSync(output,{recursive:true});
const token=crypto.randomBytes(32).toString('hex'); const headers={ Cookie:`tiladys_session=${token}`,Origin:base,'Content-Type':'application/json' };
const median = values => [...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
const results={ method:'Local production builds; 1 first request plus 7 warm sequential requests; fetch through complete response body. First request is not guaranteed cold. Query A/B is interleaved over identical rows.', node:process.version, measurements:{} };
let user; const benchmarkIds=[];
try {
  user=await db.adminUser.create({data:{email:`performance-${Date.now()}@example.test`,passwordHash:'unused',secretWordHash:'unused'}});
  await db.session.create({data:{userId:user.id,tokenHash:crypto.createHash('sha256').update(token).digest('hex'),expiresAt:new Date(Date.now()+3600000)}});
  const customer=await db.customer.findFirstOrThrow({where:{customerNumber:'SYNTHETIC-REVIEW'}}); const company=await db.company.findFirstOrThrow({where:{name:'Synthetic Review GmbH'}}); const job=await db.serviceJob.findFirstOrThrow({where:{jobNumber:'JOB-REVIEW'}}); const invoice=await db.invoice.findFirstOrThrow({where:{serviceJobId:job.id},include:{lines:true}});
  results.dataset={customers:await db.customer.count(),companies:await db.company.count(),jobs:await db.serviceJob.count(),invoices:await db.invoice.count(),services:await db.priceItem.count(),projects:await db.project.count()};
  writeFileSync('/tmp/tiladys-review-browser.json',JSON.stringify({token,customerId:customer.id,companyId:company.id,jobId:job.id,invoiceId:invoice.id}));
  for(const [name,path,origin] of [['dashboard','/dashboard'],['customer',`/dashboard/customers/${customer.id}`],['company',`/dashboard/companies/${company.id}`],['jobs','/dashboard/service-jobs'],['invoices','/dashboard/invoices'],['catalogue','/api/admin/catalogue'],['pdf',`/api/admin/invoices/${invoice.id}/pdf`],['home','/en','http://127.0.0.1:3100'],['services','/en/services','http://127.0.0.1:3100'],['portfolio','/en/portfolio','http://127.0.0.1:3100'],['project','/en/portfolio/synthetic-review','http://127.0.0.1:3100']]) {
    const times=[];let bytes=0;for(let i=0;i<8;i++){const start=performance.now();const response=await fetch((origin||base)+path,{headers:origin?{}:headers});const buffer=await response.arrayBuffer();assert.equal(response.status,200,name);bytes=buffer.byteLength;times.push(+(performance.now()-start).toFixed(2))}results.measurements[name]={firstMs:times[0],warmMs:times.slice(1),medianWarmMs:median(times.slice(1)),bytes};
  }
  const {id,lines,createdAt,updatedAt,...template}=invoice;
  const pdf=readFileSync(output+'/multilingual-issued.pdf');
  for(let i=0;i<50;i++){const row=await db.invoice.create({data:{...template,serviceJobId:null,status:'ISSUED',invoiceNumber:`PERF-${Date.now()}-${i}`,issuedPdf:pdf,issuedPdfSize:pdf.length,issuedPdfChecksum:crypto.createHash('sha256').update(pdf).digest('hex')}});benchmarkIds.push(row.id)}
  const before=[],after=[];for(let i=0;i<10;i++){for(const omit of (i%2?[true,false]:[false,true])){const start=performance.now();await db.invoice.findMany({where:{id:{in:benchmarkIds}},...(omit?{omit:{issuedPdf:true}}:{})});(omit?after:before).push(+(performance.now()-start).toFixed(2))}}
  results.queryComparison={rows:50,pdfBytesPerRow:pdf.length,archivedBytesAvoided:50*pdf.length,beforeMs:before,afterMs:after,medianBeforeMs:median(before),medianAfterMs:median(after)};
  writeFileSync(output+'/performance.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
} finally {await db.invoice.deleteMany({where:{id:{in:benchmarkIds}}}); await db.$disconnect();}
// The synthetic session is kept for the immediately following local browser checks;
// expires within one hour. No real identity or password is used.
