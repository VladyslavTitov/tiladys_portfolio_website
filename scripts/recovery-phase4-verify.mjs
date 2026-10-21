// Approved Phase 4: fail-closed, read-only verification of the exact Preview target.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {PrismaClient} from '@prisma/client';
import {catalog} from './recovery-common.mjs';
export const priv='/tmp/tiladys-schema-recovery-20261021/phase4';
export const evidence='docs/recovery/2026-10-21/evidence/phase4';
export const project='prj_6YJMTiWWHE0lX8nzUYCUpA82tEvV',team='team_xIA4aFDewxF4sHVLtMnss2me';
const cli='/home/tiladys/.npm/_npx/67eb4586ca667318/node_modules/vercel/dist/index.js';
export const hash=b=>createHash('sha256').update(b).digest('hex');
export async function api(path){
 const r=spawnSync(process.execPath,[cli,'api',path+(path.includes('?')?'&':'?')+'teamId='+team,'--method','GET','--raw','--scope',team,'--non-interactive'],{encoding:'utf8',timeout:90000,maxBuffer:8*1024*1024});
 assert.equal(r.status,0,'Scoped read-only Vercel API request failed');return JSON.parse(r.stdout);
}
export function assertTarget(u){assert.equal(u.hostname,'ep-purple-unit-b1brl6mf.c-5.eu-central-1.aws.neon.tech');assert.equal(u.pathname,'/neondb');assert.equal(u.username,'neondb_owner');assert.equal(u.searchParams.get('schema')||'public','public');assert.equal(u.searchParams.get('sslmode'),'require');}
export async function verifyMapping(){
 await mkdir(priv,{recursive:true,mode:0o700});await mkdir(evidence,{recursive:true});
 const p=await api('/v9/projects/'+project);assert.equal(p.id,project);assert.equal(p.accountId,team);assert.equal(p.name,'tiladys-control');assert.equal(p.rootDirectory,'apps/control');
 const metadata=await api('/v10/projects/'+project+'/env');assert.ok(Array.isArray(metadata.envs));
 const entries=metadata.envs.filter(e=>['DATABASE_URL','DATABASE_URL_UNPOOLED'].includes(e.key)&&e.target?.includes('preview'));
 assert.equal(entries.length,2,'Unexpected Preview database entries/overrides');assert.ok(entries.every(e=>!e.gitBranch&&!(e.customEnvironmentIds?.length)));
 const directEntry=entries.find(e=>e.key==='DATABASE_URL_UNPOOLED');const pooledEntry=entries.find(e=>e.key==='DATABASE_URL');assert.equal(directEntry.id,'wCTgS9vkb0OPDVBP');assert.equal(pooledEntry.id,'KlUTy7ESBL0U0blP');
 const direct=await api('/v1/projects/'+project+'/env/'+directEntry.id),pooled=await api('/v1/projects/'+project+'/env/'+pooledEntry.id);
 assert.equal(direct.key,'DATABASE_URL_UNPOOLED');assert.deepEqual(direct.target,['preview']);assert.equal(direct.gitBranch,undefined);assert.deepEqual(pooled.target,['preview']);
 const url=new URL(direct.value),runtime=new URL(pooled.value);assertTarget(url);assert.equal(runtime.hostname,'ep-purple-unit-b1brl6mf-pooler.c-5.eu-central-1.aws.neon.tech');assert.equal(runtime.pathname,url.pathname);assert.equal(runtime.username,url.username);assert.equal(runtime.searchParams.get('schema')||'public','public');
 // Compare privately with the approved audit; never print or persist plaintext in evidence.
 const old=JSON.parse(await readFile('/tmp/tiladys-schema-recovery-20261021/preview-direct.private.json','utf8'));assert.equal(direct.value,old.value,'Preview connection changed since audit');
 await writeFile(priv+'/direct.private.json',JSON.stringify(direct),{mode:0o600});
 await writeFile(evidence+'/target.json',JSON.stringify({checkedAt:new Date().toISOString(),projectId:p.id,teamId:p.accountId,name:p.name,root:p.rootDirectory,nodeVersion:p.nodeVersion,directHost:url.hostname,runtimeHost:runtime.hostname,database:'neondb',schema:'public',directEntryId:direct.id,pooledEntryId:pooled.id,unchangedSinceAudit:true,previewOverrides:[],entries:entries.map(e=>({id:e.id,key:e.key,target:e.target,updatedAt:e.updatedAt}))},null,2));return url;
}
export async function checksums(){
 const expected=JSON.parse(await readFile('docs/recovery/2026-10-21/evidence/migration-file-checksums.json','utf8'));
 const names=(await readdir('packages/db/prisma/migrations')).filter(n=>/^\d/.test(n)).sort();assert.equal(names.length,23);assert.deepEqual(names,expected.map(e=>e.name));
 for(const e of expected)assert.equal(hash(await readFile('packages/db/prisma/migrations/'+e.name+'/migration.sql')),e.sha256,'Migration SQL changed: '+e.name);return expected;
}
export async function snapshot(db){
 const schema=await catalog(db);
 const proof=await db.$transaction(async tx=>{await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
 const identity=await tx.$queryRawUnsafe(`SELECT current_database() AS database,current_schema() AS schema,current_user AS role,current_setting('server_version') AS version`);
 const ledger=await tx.$queryRawUnsafe('SELECT migration_name,checksum,finished_at,rolled_back_at,applied_steps_count FROM "_prisma_migrations" ORDER BY migration_name');
 const fingerprints=[];for(const t of schema.tables.filter(t=>t.tablename!=='_prisma_migrations')){const q='"'+t.tablename.replaceAll('"','""')+'"';const rows=await tx.$queryRawUnsafe(`SELECT to_jsonb(t)::text AS row FROM ${q} t ORDER BY to_jsonb(t)::text`);fingerprints.push({table:t.tablename,count:rows.length,sha256:hash(JSON.stringify(rows))});}
 return {identity,ledger,fingerprints};},{isolationLevel:'RepeatableRead',timeout:60000});return {schema,...proof};
}
export async function preflight(url){
 const files=await checksums();const db=new PrismaClient({datasourceUrl:url.href,log:[]});try{
 const state=await snapshot(db);assert.equal(state.identity[0].database,'neondb');assert.equal(state.identity[0].schema,'public');assert.equal(state.identity[0].role,'neondb_owner');
 const old=JSON.parse(await readFile('docs/recovery/2026-10-21/evidence/child-before-catalog.json','utf8'));assert.deepEqual(state.schema,old,'STOP: source schema or counts changed since audit');
 const original=JSON.parse(await readFile('docs/recovery/2026-10-21/evidence/preview-catalog.json','utf8'));assert.equal(state.ledger.length,13);
 for(let i=0;i<13;i++){const row=state.ledger[i];assert.equal(row.migration_name,files[i].name);assert.equal(row.checksum,files[i].sha256);assert.ok(row.finished_at&&!row.rolled_back_at);assert.equal(row.applied_steps_count,1);assert.equal(new Date(row.finished_at).toISOString(),original.ledger.find(x=>x.migration_name===row.migration_name).finished_at);}
 const rows=await db.$queryRawUnsafe('SELECT to_jsonb(t)::text AS row FROM "NumberSequence" t ORDER BY scope,year');const backup=JSON.parse(await readFile('docs/recovery/2026-10-21/evidence/backup-restore.json','utf8'));assert.equal(hash(JSON.stringify(rows)),backup.numberSequenceSha256,'STOP: sequence records changed');
 await writeFile(evidence+'/before.json',JSON.stringify(state,null,2));await writeFile(evidence+'/preflight.json',JSON.stringify({checkedAt:new Date().toISOString(),schemaUnchanged:true,dataUnchanged:true,completed:13,pending:files.slice(13),all23FileChecksumsMatch:true,ledgerUnchanged:true},null,2));return state;
 }finally{await db.$disconnect();}
}
if(process.argv[1]?.endsWith('/recovery-phase4-verify.mjs'))try{await preflight(await verifyMapping());console.log('Phase 4 preflight PASS: exact Preview mapping, 13 completed/10 approved pending, all checksums, schema and original data unchanged.');}catch(e){await mkdir(evidence,{recursive:true});await writeFile(evidence+'/preflight-failure.log',String(e.stack||e).replace(/postgres(?:ql)?:\/\/[^\s"']+/g,'[REDACTED]'));console.error('PHASE4_PREFLIGHT_FAILED: stopped before migration; see sanitized evidence.');process.exitCode=1;}
