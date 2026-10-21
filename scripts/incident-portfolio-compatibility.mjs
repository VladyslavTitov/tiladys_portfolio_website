// Read-only compatibility checks; no Production rows or credentials are persisted.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {PrismaClient} from '@prisma/client';
import {api,mapping,evidence,summary} from './incident-portfolio-inspect.mjs';
async function main(){
const p='prj_JWa4iXqzV70GdY3TKDDL2Q5poRRv',c='prj_6YJMTiWWHE0lX8nzUYCUpA82tEvV';
const map=await mapping(p,'production'),direct=map.find(e=>e.entry.key==='DATABASE_URL_UNPOOLED').url;
assert.equal(direct.hostname,'ep-frosty-hall-a2rder07.eu-central-1.aws.neon.tech');
const diffs=[];
for(const [label,schema]of [['current','packages/db/prisma/schema.prisma'],['e82bff0','/tmp/tiladys-compatible-schema.prisma']]){
const r=spawnSync(process.execPath,['node_modules/prisma/build/index.js','migrate','diff','--from-schema-datasource','packages/db/prisma/schema.prisma','--to-schema-datamodel',schema,'--script','--exit-code'],{env:{...process.env,DATABASE_URL:direct.href},encoding:'utf8',timeout:90000,maxBuffer:8*1024*1024});
let output=r.stdout+r.stderr;for(const s of [direct.href,direct.password,decodeURIComponent(direct.password)])if(s)output=output.split(s).join('[REDACTED]');await writeFile(evidence+'/production-'+label+'-datamodel-diff.sql',output);assert.ok([0,2].includes(r.status),'Read-only schema diff failed: '+label+' '+r.status);diffs.push({release:label,exitCode:r.status,noDifference:r.status===0});}
const production=JSON.parse(await readFile(evidence+'/tiladys-public-production-database.json','utf8'));
const baseline=JSON.parse(await readFile('docs/recovery/2026-10-21/evidence/preview-catalog.json','utf8'));
const comparison={};for(const key of ['columns','enums','indexes'])comparison[key]=JSON.stringify(production.schema[key])===JSON.stringify(baseline[key]);
const normalize=rows=>rows.filter(r=>r.contype!=='n');comparison.constraintsExcludingPg18NotNull=JSON.stringify(normalize(production.schema.constraints))===JSON.stringify(normalize(baseline.constraints));
const old=summary(api('/v13/deployments/dpl_5B38LjUBUFpAGnfS3whyHVG9qmJx'));
const envs=api('/v10/projects/'+c+'/env').envs.filter(e=>e.target?.includes('preview'));
const authConfig=[];for(const key of ['AUTH_SECRET','CONTROL_URL','CONTROL_ALLOWED_ORIGINS','AUTH_IP_HEADER']){const rows=envs.filter(e=>e.key===key);for(const row of rows){const e=api('/v1/projects/'+c+'/env/'+row.id);authConfig.push({key,configured:true,valueReadable:typeof e.value==='string',type:e.type,gitBranch:e.gitBranch,updatedAt:e.updatedAt,...(key==='AUTH_SECRET'?{atLeast32Characters:typeof e.value==='string'?e.value.length>=32:null}:{value:e.value})});}if(!rows.length)authConfig.push({key,configured:false});}
const db=new PrismaClient({datasourceUrl:direct.href,log:[]});let records;
try{records=await db.$transaction(async tx=>{await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
const published=await tx.$queryRawUnsafe(`SELECT "slug","category","title"->>'en' AS title FROM "Project" WHERE "status"='PUBLISHED' ORDER BY "sortOrder","updatedAt" DESC`);
const images=await tx.$queryRawUnsafe(`SELECT i.id,p.slug,i."mimeType",i.size FROM "ProjectImage" i JOIN "Project" p ON p.id=i."projectId" WHERE p.status='PUBLISHED' ORDER BY p.slug,i."sortOrder"`);
const privateProjects=await tx.$queryRawUnsafe(`SELECT md5(slug) AS "slugFingerprint",status FROM "Project" WHERE status<>'PUBLISHED'`);
const fingerprints=[];for(const table of ['Project','ProjectImage','Customer','Company','Invoice','InvoiceLine','InvoicePayment','ServiceJob','ServiceJobLineItem','NumberSequence']){const [row]=await tx.$queryRawUnsafe(`SELECT count(*)::text AS count,md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'' ORDER BY md5(to_jsonb(t)::text)),'')) AS fingerprint FROM "${table}" t`);fingerprints.push({table,...row});}
return {published,images,privateProjects,fingerprints,quoteTablePresent:production.schema.tables.some(t=>t.tablename==='Quote')};},{isolationLevel:'RepeatableRead',timeout:60000});}finally{await db.$disconnect();}
const result={checkedAt:new Date().toISOString(),diffs,comparison,rollbackCandidate:old,previewAuthConfig:authConfig,records};await writeFile(evidence+'/compatibility.json',JSON.stringify(result,null,2));console.log(JSON.stringify({...result,records:{published:records.published,images:records.images.length,privateProjectCount:records.privateProjects.length,fingerprints:records.fingerprints,quoteTablePresent:records.quoteTablePresent}},null,2));
}
main().catch(e=>{console.error('READONLY_COMPATIBILITY_CHECK_FAILED',e.code||e.name);process.exitCode=1;});
