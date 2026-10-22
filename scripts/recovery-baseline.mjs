import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,readdir,cp} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {PrismaClient} from '@prisma/client';
import {connections,assertWritable,command,catalog,privateRoot,evidenceRoot,childIdentity} from './recovery-common.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
async function main(){
 const c=await connections();assertWritable(c.child,c);assertWritable(c.local,c);
 const child=new PrismaClient({datasourceUrl:c.child.href,log:[]});
 const expectedUrl=new URL(c.local);expectedUrl.pathname='/recovery_expected13';assertWritable(expectedUrl,c);
 const created=spawnSync('docker',['exec',c.container,'createdb','-U',c.localRole,'recovery_expected13'],{encoding:'utf8'});assert.ok(created.status===0||created.stderr.includes('already exists'),'Owned expected-schema database required');
 const stage=privateRoot+'/baseline13';await mkdir(stage+'/migrations',{recursive:true,mode:0o700});
 const migrations=(await readdir('packages/db/prisma/migrations')).filter(x=>/^\d/.test(x)).sort();assert.equal(migrations.length,23);
 await cp('packages/db/prisma/schema.prisma',stage+'/schema.prisma');await cp('packages/db/prisma/migrations/migration_lock.toml',stage+'/migrations/migration_lock.toml');
 for(const name of migrations.slice(0,13))await cp('packages/db/prisma/migrations/'+name,stage+'/migrations/'+name,{recursive:true});
 await command(['node_modules/prisma/build/index.js','migrate','deploy','--schema',stage+'/schema.prisma'],expectedUrl,'expected13-migrate');
 const expected=new PrismaClient({datasourceUrl:expectedUrl.href,log:[]});
 try{
  const [source,baseline]=await Promise.all([catalog(child),catalog(expected)]);
  for(const key of ['tables','columns','enums','constraints','indexes'])assert.deepEqual(source[key],baseline[key],`Source differs from clean 13-migration baseline: ${key}`);
  await writeFile(evidenceRoot+'/baseline13-comparison.json',JSON.stringify({target:childIdentity,matched:['tables','columns (types, defaults, nullability, precision)','enum values and order','constraints and validation','index definitions including partial unique indexes'],tables:source.tables.length,columns:source.columns.length,constraints:source.constraints.length,indexes:source.indexes.length,counts:source.counts},null,2));
  await writeFile(evidenceRoot+'/child-before-catalog.json',JSON.stringify(source,null,2));
  // pg_dump credentials are inherited through the Docker client's environment, never command arguments.
  const dump=spawnSync('docker',['exec','-e','PGPASSWORD','-e','PGSSLMODE=require',c.container,'pg_dump','-h',c.child.hostname,'-U',decodeURIComponent(c.child.username),'-d','neondb','-Fc','--no-owner','--no-privileges','--schema=public'],{env:{...process.env,PGPASSWORD:decodeURIComponent(c.child.password)},maxBuffer:64*1024*1024});
  assert.equal(dump.status,0,'Private pre-migration dump failed: '+String(dump.stderr));assert.ok(dump.stdout.length>1000);
  await writeFile(privateRoot+'/preview-before.dump',dump.stdout,{mode:0o600});
  const listing=spawnSync('docker',['exec','-i',c.container,'pg_restore','--list'],{input:dump.stdout,encoding:'utf8'});assert.equal(listing.status,0);
  // Fresh PostgreSQL databases already own an empty public schema. Exclude only its CREATE entry.
  const list=listing.stdout.split('\n').filter(line=>!/^\d+; \d+ \d+ SCHEMA - public /.test(line)).join('\n');
  await writeFile(privateRoot+'/restore.list',list,{mode:0o600});assert.equal(spawnSync('docker',['cp',privateRoot+'/restore.list',c.container+':/tmp/recovery-restore.list']).status,0);
  const probe=spawnSync('docker',['exec',c.container,'psql','-U',c.localRole,'-d','recovery','-Atc',`SELECT to_regclass('public."NumberSequence"') IS NOT NULL`],{encoding:'utf8'});assert.equal(probe.status,0);
  if(probe.stdout.trim()!=='t'){const restored=spawnSync('docker',['exec','-i',c.container,'pg_restore','-U',c.localRole,'-d','recovery','--exit-on-error','--no-owner','--no-privileges','--use-list=/tmp/recovery-restore.list'],{input:dump.stdout,maxBuffer:8*1024*1024});assert.equal(restored.status,0,'Restore into isolated local database failed: '+String(restored.stderr));}
  const local=new PrismaClient({datasourceUrl:c.local.href,log:[]});
  try{
   const restoredCatalog=await catalog(local);assert.deepEqual(restoredCatalog,source,'Restored schema/counts must exactly equal child before migration');
   const rows=await child.$queryRawUnsafe('SELECT to_jsonb(t)::text AS row FROM "NumberSequence" t ORDER BY scope,year');const restoredRows=await local.$queryRawUnsafe('SELECT to_jsonb(t)::text AS row FROM "NumberSequence" t ORDER BY scope,year');assert.deepEqual(restoredRows,rows);
   await writeFile(evidenceRoot+'/backup-restore.json',JSON.stringify({source:childIdentity,privateDump:privateRoot+'/preview-before.dump',format:'PostgreSQL 18 custom archive; public schema; no owners/privileges',bytes:dump.stdout.length,sha256:hash(dump.stdout),restoredInto:'owned disposable PostgreSQL 18 at 127.0.0.1:55435/recovery',schemaCountsAndDefinitionsEqual:true,numberSequenceRows:rows.length,numberSequenceSha256:hash(JSON.stringify(rows)),realTargetRestorePerformed:false},null,2));
  }finally{await local.$disconnect();}
 }finally{await child.$disconnect();await expected.$disconnect();}
 console.log('Verified child matches all 13 migrations; backup restored with identical schema, counts and sequence rows. Real Preview unchanged.');
}
main().catch(async e=>{let detail=String(e.stack||e);for(const file of ['preview-direct.private.json','local-lab.private.json']){try{const p=JSON.parse(await readFile(privateRoot+'/'+file,'utf8'));const u=new URL(p.value||p.url);for(const secret of [u.href,u.password,decodeURIComponent(u.password)])if(secret)detail=detail.split(secret).join('[REDACTED]');}catch{}}detail=detail.replace(/postgres(?:ql)?:\/\/[^\s"']+/g,'[REDACTED_DATABASE_URL]');await writeFile(evidenceRoot+'/baseline-failure.log',detail);console.error('RECOVERY_BASELINE_FAILED: sanitized evidence/baseline-failure.log');process.exitCode=1;});
