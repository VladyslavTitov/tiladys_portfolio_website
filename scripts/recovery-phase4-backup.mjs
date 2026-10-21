import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,chmod} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {PrismaClient} from '@prisma/client';
import {priv,evidence,assertTarget,hash,snapshot,checksums} from './recovery-phase4-verify.mjs';
const container='tiladys-schema-recovery-20261021';
function docker(args,options={}){const r=spawnSync('docker',args,{maxBuffer:64*1024*1024,...options});assert.equal(r.status,0,'Recovery backup/restore Docker command failed');return r.stdout;}
async function main(){
 const url=new URL(JSON.parse(await readFile(priv+'/direct.private.json','utf8')).value);assertTarget(url);await checksums();
 const inspected=JSON.parse(docker(['inspect',container],{encoding:'utf8'}))[0];assert.equal(inspected.Config.Image,'postgres:18-alpine');assert.equal(inspected.Config.Labels.purpose,'tiladys-schema-recovery-20261021');assert.equal(inspected.State.Running,true);assert.equal(inspected.NetworkSettings.Ports['5432/tcp'][0].HostIp,'127.0.0.1');assert.equal(inspected.NetworkSettings.Ports['5432/tcp'][0].HostPort,'55435');
 const source=new PrismaClient({datasourceUrl:url.href,log:[]});
 try{
 const before=JSON.parse(await readFile(evidence+'/before.json','utf8'));assert.deepEqual(JSON.parse(JSON.stringify(await snapshot(source))),before,'STOP: source changed before fresh backup');
 const bytes=docker(['exec','-e','PGPASSWORD','-e','PGSSLMODE=require',container,'pg_dump','-h',url.hostname,'-U',decodeURIComponent(url.username),'-d','neondb','-Fc','--no-owner','--no-privileges','--schema=public'],{env:{...process.env,PGPASSWORD:decodeURIComponent(url.password)}});assert.ok(bytes.length>1000);
 const stamp=new Date().toISOString().replaceAll(/[-:.]/g,'');const dir=resolve('.env.recovery-backups/2026-10-21');await mkdir(dir,{recursive:true,mode:0o700});await chmod(dir,0o700);await chmod(resolve('.env.recovery-backups'),0o700);const path=dir+'/preview-phase4-before-'+stamp+'.dump';assert.equal(spawnSync('git',['check-ignore','-q',path]).status,0);await writeFile(path,bytes,{mode:0o600,flag:'wx'});
 const listing=docker(['exec','-i',container,'pg_restore','--list'],{input:bytes,encoding:'utf8'});const list=listing.split('\n').filter(l=>!/^\d+; \d+ \d+ SCHEMA - public /.test(l)).join('\n');const listpath=priv+'/phase4-restore.list';await writeFile(listpath,list,{mode:0o600});docker(['cp',listpath,container+':/tmp/phase4-restore.list']);
 const local=JSON.parse(await readFile('/tmp/tiladys-schema-recovery-20261021/local-lab.private.json','utf8'));const restoreDb='recovery_phase4_restore_'+Date.now();assert.match(restoreDb,/^recovery_phase4_restore_\d+$/);docker(['exec',container,'createdb','-U',local.role,restoreDb]);
 docker(['exec','-i',container,'pg_restore','-U',local.role,'-d',restoreDb,'--exit-on-error','--no-owner','--no-privileges','--use-list=/tmp/phase4-restore.list'],{input:await readFile(path)});
 const localUrl=new URL(local.url);assert.equal(localUrl.hostname,'127.0.0.1');assert.equal(localUrl.port,'55435');localUrl.pathname='/'+restoreDb;const restored=new PrismaClient({datasourceUrl:localUrl.href,log:[]});try{const recovered=await snapshot(restored);assert.deepEqual(recovered.schema,before.schema);assert.deepEqual(JSON.parse(JSON.stringify(recovered.ledger)),before.ledger);assert.deepEqual(recovered.fingerprints,before.fingerprints);}finally{await restored.$disconnect();}
 assert.deepEqual(JSON.parse(JSON.stringify(await snapshot(source))),before,'STOP: source changed during backup and restore verification');
 await writeFile(evidence+'/backup.json',JSON.stringify({checkedAt:new Date().toISOString(),sourceHost:url.hostname,branchId:'br-delicate-block-b19w0iqs',path,sha256:hash(await readFile(path)),bytes:bytes.length,fileMode:'0600',directoryMode:'0700',gitIgnored:true,format:'PostgreSQL 18 custom; public schema/data; no owners/grants',restoreDatabase:restoreDb,restoreHost:'127.0.0.1:55435',allSchemaDefinitionsMatch:true,allTableCountsAndRowFingerprintsMatch:true,all13LedgerRowsMatch:true,sourceUnchangedAfterVerification:true,realTargetRestored:false},null,2));
 console.log('Fresh Preview backup PASS: retained privately, restored into a new isolated local database; schema, all original row fingerprints and migration ledger match. Source remains unchanged.');
 }finally{await source.$disconnect();}
}
main().catch(()=>{console.error('PHASE4_BACKUP_FAILED: STOP; no real-target migration permitted.');process.exitCode=1;});
