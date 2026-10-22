// One-shot explicitly approved Preview migration. Never use this script to retry a failure.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {PrismaClient} from '@prisma/client';
import {priv,evidence,assertTarget,hash,snapshot,checksums,verifyMapping} from './recovery-phase4-verify.mjs';
const npm='/usr/lib/node_modules_22/npm/bin/npm-cli.js';
let attempted=false,url;
async function command(args,name){
 const child=spawn(process.execPath,args,{env:{...process.env,DATABASE_URL:url.href,DATABASE_URL_UNPOOLED:url.href,DIRECT_URL:url.href,SHADOW_DATABASE_URL:''},stdio:['ignore','pipe','pipe']});let output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);const code=await new Promise((res,rej)=>{child.on('error',rej);child.on('exit',res);});for(const s of [url.href,url.password,decodeURIComponent(url.password)])if(s)output=output.split(s).join('[REDACTED]');await writeFile(evidence+'/'+name+'.log',output);assert.equal(code,0,name+' failed: STOP; inspect evidence before any further action');return output;
}
async function main(){
 // Exclusive marker makes accidental repeat execution fail before any mutation.
 const marker=priv+'/deployment-attempt.private.json';try{await readFile(marker);throw new Error('A deployment was already attempted; do not retry');}catch(e){if(e.code!=='ENOENT')throw e;}
 url=await verifyMapping();assertTarget(url);const files=await checksums();
 const before=JSON.parse(await readFile(evidence+'/before.json','utf8')),backup=JSON.parse(await readFile(evidence+'/backup.json','utf8'));
 assert.equal(hash(await readFile(backup.path)),backup.sha256);assert.ok(backup.allSchemaDefinitionsMatch&&backup.allTableCountsAndRowFingerprintsMatch&&backup.all13LedgerRowsMatch&&backup.sourceUnchangedAfterVerification);assert.ok(Date.now()-Date.parse(backup.checkedAt)<15*60*1000,'Backup verification too old');
 url.searchParams.set('options','-c lock_timeout=5000 -c statement_timeout=120000');url.searchParams.set('connection_limit','1');
 const db=new PrismaClient({datasourceUrl:url.href,log:[]});try{
 const settings=await db.$queryRawUnsafe(`SELECT current_setting('lock_timeout') AS lock_timeout,current_setting('statement_timeout') AS statement_timeout`);assert.deepEqual(settings,[{lock_timeout:'5s',statement_timeout:'2min'}]);
 assert.deepEqual(JSON.parse(JSON.stringify(await snapshot(db))),before,'STOP: source changed immediately before migration');
 const sessions=await db.$queryRawUnsafe(`SELECT pid,usename,application_name,state FROM pg_stat_activity WHERE datname=current_database() AND usename=current_user AND pid<>pg_backend_pid() AND backend_type='client backend'`);assert.equal(sessions.length,0,'STOP: another application/owner session is present; Preview writes are not quiescent');
 await command([npm,'run','db:diagnose'],'predeploy-diagnose');
 // Recheck after the diagnostic command and immediately before applying the approved files.
 assert.deepEqual(JSON.parse(JSON.stringify(await snapshot(db))),before);await checksums();
 await writeFile(evidence+'/execution-preconditions.json',JSON.stringify({checkedAt:new Date().toISOString(),backupSha256:backup.sha256,schemaLedgerAndRowsStillMatch:true,otherOwnerClientSessions:0,sessionTimeouts:settings[0],pending:files.slice(13).map(f=>f.name),remoteSettingsChanged:false},null,2));
 const started=new Date();await writeFile(marker,JSON.stringify({startedAt:started.toISOString(),host:url.hostname,pending:files.slice(13).map(f=>f.name)}),{mode:0o600,flag:'wx'});attempted=true;
 await command([npm,'run','db:deploy'],'db-deploy');const completed=new Date();
 const after=await snapshot(db);assert.equal(after.ledger.length,23);for(let i=0;i<23;i++){assert.equal(after.ledger[i].migration_name,files[i].name);assert.equal(after.ledger[i].checksum,files[i].sha256);assert.ok(after.ledger[i].finished_at&&!after.ledger[i].rolled_back_at);assert.equal(after.ledger[i].applied_steps_count,1);}
 for(const row of before.ledger)assert.deepEqual(JSON.parse(JSON.stringify(after.ledger.find(r=>r.migration_name===row.migration_name))),row,'Original migration ledger row changed');
 for(const original of before.fingerprints)assert.deepEqual(after.fingerprints.find(f=>f.table===original.table),original,'Original data changed: '+original.table);
 assert.ok(after.fingerprints.filter(f=>!before.fingerprints.some(b=>b.table===f.table)).every(f=>f.count===0),'New feature table unexpectedly populated');
 const expected=JSON.parse(await readFile('docs/recovery/2026-10-21/evidence/child-after-catalog.json','utf8'));for(const key of ['tables','columns','enums','constraints','indexes'])assert.deepEqual(after.schema[key],expected[key],'Migrated schema differs from reviewed child: '+key);
 await writeFile(evidence+'/after.json',JSON.stringify(after,null,2));
 await command([npm,'run','db:check:crm'],'check-crm');await command(['node_modules/prisma/build/index.js','migrate','status','--schema','packages/db/prisma/schema.prisma'],'migration-status');
 await command(['node_modules/prisma/build/index.js','migrate','diff','--from-schema-datasource','packages/db/prisma/schema.prisma','--to-schema-datamodel','packages/db/prisma/schema.prisma','--exit-code'],'datamodel-diff');
 await writeFile(evidence+'/migration-result.json',JSON.stringify({startedAt:started.toISOString(),completedAt:completed.toISOString(),milliseconds:completed-started,neonProject:'tiladys-control-preview',projectId:'plain-sound-02437622',branch:'main',branchId:'br-delicate-block-b19w0iqs',host:url.hostname,database:'neondb',schema:'public',applied:files.slice(13),completedMigrations:23,allChecksumsMatch:true,originalLedgerUnchanged:true,originalTableFingerprintsUnchanged:true,newTablesEmpty:true,schemaMatchesRehearsal:true,crmGuard:'pass',migrationStatus:'up to date',datamodelDiff:'empty',productionAccessed:false,deploymentCreated:false,remoteEnvironmentChanged:false},null,2));
 console.log('APPROVED PREVIEW MIGRATION COMPLETE: exactly ten applied; all 23 checksums verified; original data unchanged; db:check:crm, migration status and datamodel diff PASS.');
 }finally{await db.$disconnect();}
}
main().catch(async e=>{let error=String(e.stack||e);if(url)for(const s of [url.href,url.password,decodeURIComponent(url.password)])if(s)error=error.split(s).join('[REDACTED]');await writeFile(evidence+'/deployment-failure.log',error.replace(/postgres(?:ql)?:\/\/[^\s"']+/g,'[REDACTED]'));console.error('PHASE4_STOPPED; migrationAttempted='+attempted+'; inspect sanitized deployment-failure.log. No automatic retry.');process.exitCode=1;});
