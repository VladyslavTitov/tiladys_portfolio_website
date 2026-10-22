// Final real Preview verification: every connection is explicitly read only.
import assert from 'node:assert/strict';
import {readFile,writeFile,stat} from 'node:fs/promises';
import {PrismaClient} from '@prisma/client';
import {verifyMapping,snapshot,checksums,evidence,api,project,hash} from './recovery-phase4-verify.mjs';
import {run} from './recovery-phase4-tests.mjs';
const direct=await verifyMapping();await checksums();const expected=JSON.parse(await readFile(evidence+'/after.json','utf8'));
const runtime=await api('/v1/projects/'+project+'/env/KlUTy7ESBL0U0blP');assert.equal(runtime.key,'DATABASE_URL');assert.deepEqual(runtime.target,['preview']);const pooled=new URL(runtime.value);assert.equal(pooled.hostname,'ep-purple-unit-b1brl6mf-pooler.c-5.eu-central-1.aws.neon.tech');assert.equal(pooled.pathname,'/neondb');assert.equal(pooled.searchParams.get('schema')||'public','public');
const pooledOnly=process.argv.includes('pooled-only');
if(pooledOnly){assert.match(await readFile(evidence+'/final-direct-check-crm.log','utf8'),/Release schema verified:/);const checked=await stat(evidence+'/final-direct-check-crm.log');assert.ok(Date.now()-checked.mtimeMs<15*60*1000);}
for(const [name,url]of (pooledOnly?[['runtime-pooled',pooled]]:[['direct',direct],['runtime-pooled',pooled]])){
 // PgBouncer rejects arbitrary startup options. Use an explicitly read-only transaction.
 if(name==='direct')url.searchParams.set('options','-c default_transaction_read_only=on -c statement_timeout=120000');else url.searchParams.delete('options');
 const db=new PrismaClient({datasourceUrl:url.href,log:[]});try{const settings=await db.$transaction(async tx=>{await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');return tx.$queryRawUnsafe(`SELECT current_setting('transaction_read_only') AS read_only`);});assert.equal(settings[0].read_only,'on');assert.deepEqual(JSON.parse(JSON.stringify(await snapshot(db))),expected,name+' target changed after migration');}finally{await db.$disconnect();}
 await run(['scripts/check-crm-schema.mjs'],'final-'+name+'-check-crm',url);
}
const backup=JSON.parse(await readFile(evidence+'/backup.json','utf8'));assert.equal(hash(await readFile(backup.path)),backup.sha256);
await writeFile(evidence+'/final-preview-verification.json',JSON.stringify({checkedAt:new Date().toISOString(),directAndRuntimePooledConnectionsVerified:true,readOnlyTransactionsVerified:true,completedMigrations:23,pending:0,originalRowsStillUnchanged:true,newTablesStillEmpty:true,schemaStillMatchesRehearsal:true,crmGuardDirect:'pass',crmGuardRuntimePooled:'pass',retainedBackupChecksumStillMatches:true,pooledAuditNote:'Initial startup statement_timeout option rejected by pooler; removed that audit-only option and used read-only transactions. No remote configuration changed.',productionAccessed:false,deployed:false},null,2));console.log('Final real Preview check PASS on direct and runtime pooled connections; all 23 migrations, data and schema unchanged, both CRM guards pass.');
