import assert from 'node:assert/strict';import {readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import {PrismaClient} from '@prisma/client';
import {connections,assertWritable,command,catalog,privateRoot,evidenceRoot,childIdentity} from './recovery-common.mjs';
async function main(){
 const c=await connections();assertWritable(c.child,c);await readFile(evidenceRoot+'/backup-restore.json');await readFile(evidenceRoot+'/baseline13-comparison.json');
 const db=new PrismaClient({datasourceUrl:c.child.href,log:[]});try{
 const before=JSON.parse(await readFile(evidenceRoot+'/child-before-catalog.json','utf8'));assert.deepEqual(await catalog(db),before);
 const [seq]=await db.$queryRawUnsafe(`SELECT jsonb_agg(to_jsonb(t) ORDER BY scope,year)::text AS value FROM "NumberSequence" t`);
 const started=Date.now();await command(['/usr/lib/node_modules_22/npm/bin/npm-cli.js','run','db:deploy'],c.child,'child-migrate',{env:{PGOPTIONS:'-c lock_timeout=5s -c statement_timeout=120s'}});const milliseconds=Date.now()-started;
 await command(['node_modules/prisma/build/index.js','migrate','status','--schema','packages/db/prisma/schema.prisma'],c.child,'child-migration-status');
 await command(['scripts/diagnose-production-schema.mjs'],c.child,'child-diagnose');await command(['scripts/check-crm-schema.mjs'],c.child,'child-check-crm');
 await command(['/usr/lib/node_modules_22/npm/bin/npm-cli.js','run','db:deploy'],c.child,'child-repeat-deploy');
 const after=await catalog(db);for(const t of before.counts.filter(x=>x.table!=='_prisma_migrations'))assert.equal(after.counts.find(x=>x.table===t.table)?.count,t.count,t.table+' changed count');
 const [next]=await db.$queryRawUnsafe(`SELECT jsonb_agg(to_jsonb(t) ORDER BY scope,year)::text AS value FROM "NumberSequence" t`);assert.deepEqual(next,seq);
 const ledger=await db.$queryRawUnsafe(`SELECT migration_name,checksum,finished_at,rolled_back_at FROM "_prisma_migrations" ORDER BY migration_name`);assert.equal(ledger.length,23);for(const row of ledger){assert.ok(row.finished_at&&!row.rolled_back_at);assert.equal(row.checksum,createHash('sha256').update(await readFile('packages/db/prisma/migrations/'+row.migration_name+'/migration.sql')).digest('hex'));}
 await writeFile(evidenceRoot+'/child-after-catalog.json',JSON.stringify(after,null,2));await writeFile(evidenceRoot+'/child-migration-result.json',JSON.stringify({target:childIdentity,milliseconds,applied:ledger.slice(13).map(x=>x.migration_name),verifiedChecksums:23,oldTableCountsUnchanged:true,numberSequenceRowsUnchanged:true,releaseGuard:'pass',repeatDeploy:'no pending migrations',realTargetModified:false},null,2));console.log('Isolated Neon child: all ten migrations applied; 23 checksums verified; release guard and no-op redeploy pass; original data preserved.');
 }finally{await db.$disconnect();}
}
main().catch(()=>{console.error('ISOLATED_CHILD_REHEARSAL_FAILED; inspect sanitized logs. Do not apply to the real target.');process.exitCode=1;});
