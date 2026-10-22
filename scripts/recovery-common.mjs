// Incident-only guarded connections. No real target is ever a writable test URL.
import assert from 'node:assert/strict';import {readFile,writeFile} from 'node:fs/promises';import {spawnSync} from 'node:child_process';
export const privateRoot='/tmp/tiladys-schema-recovery-20261021',evidenceRoot='docs/recovery/2026-10-21/evidence';
export const childIdentity={projectId:'plain-sound-02437622',branchId:'br-winter-haze-b19z750x',parentId:'br-delicate-block-b19w0iqs',endpointId:'ep-morning-queen-b11zgtsf',host:'ep-morning-queen-b11zgtsf.c-5.eu-central-1.aws.neon.tech',parentLsn:'0/1DDE4C8',parentTimestamp:'2026-10-21T11:17:06Z'};
export async function connections(){
 const entry=JSON.parse(await readFile(privateRoot+'/preview-direct.private.json','utf8'));assert.equal(entry.id,'wCTgS9vkb0OPDVBP');assert.deepEqual(entry.target,['preview']);const parent=new URL(entry.value);assert.equal(parent.hostname,'ep-purple-unit-b1brl6mf.c-5.eu-central-1.aws.neon.tech');assert.equal(parent.pathname,'/neondb');
 const child=new URL(parent.href);child.hostname=childIdentity.host;for(const key of [...child.searchParams.keys()])if(!['sslmode','channel_binding','schema','connect_timeout'].includes(key))child.searchParams.delete(key);assert.notEqual(child.hostname,parent.hostname);
 const local=JSON.parse(await readFile(privateRoot+'/local-lab.private.json','utf8'));const url=new URL(local.url);assert.equal(url.hostname,'127.0.0.1');assert.equal(url.port,'55435');assert.equal(url.pathname,'/recovery');
 const inspected=spawnSync('docker',['inspect',local.name],{encoding:'utf8'});assert.equal(inspected.status,0);const c=JSON.parse(inspected.stdout)[0];assert.equal(c.Config.Image,'postgres:18-alpine');assert.equal(c.Config.Labels.purpose,'tiladys-schema-recovery-20261021');assert.equal(c.NetworkSettings.Ports['5432/tcp'][0].HostIp,'127.0.0.1');assert.equal(c.NetworkSettings.Ports['5432/tcp'][0].HostPort,'55435');assert.equal(c.State.Running,true);
 return {parent,child,local:url,container:local.name,localRole:local.role};
}
export function environment(url){return {...process.env,DATABASE_URL:url.href,DIRECT_URL:url.href,DATABASE_URL_UNPOOLED:url.href,SHADOW_DATABASE_URL:'',SMTP_HOST:'',SMTP_PASSWORD:'',SMTP_USER:'',SMTP_FROM:'',CONTACT_AUTO_REPLY_ENABLED:'false',CONTACT_STORAGE_DRIVER:'disabled',CONTACT_UPLOADS_ENABLED:'false'};}
export async function command(args,url,name,{expect=0,env={}}={}){
 const r=spawnSync(process.execPath,args,{env:{...environment(url),...env},encoding:'utf8',maxBuffer:32*1024*1024});let output=(r.stdout||'')+(r.stderr||'');for(const value of [url.href,url.password,decodeURIComponent(url.password)])if(value)output=output.split(value).join('[REDACTED]');await writeFile(`${evidenceRoot}/${name}.log`,output);assert.equal(r.status,expect,`${name} failed; see sanitized log`);return output;
}
export function assertWritable(url,c){assert.ok(url.hostname===childIdentity.host&&url.pathname==='/neondb'||url.hostname==='127.0.0.1'&&url.port==='55435'&&['/recovery','/recovery_expected13','/recovery_restore_verify'].includes(url.pathname),'ONLY_OWNED_STAGING_TARGETS_ARE_WRITABLE');assert.notEqual(url.hostname,c.parent.hostname);}
export async function catalog(db){return db.$transaction(async tx=>{
 await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
 const tables=await tx.$queryRawUnsafe(`SELECT tablename FROM pg_tables WHERE schemaname=current_schema() ORDER BY tablename`);
 const columns=await tx.$queryRawUnsafe(`SELECT table_name,column_name,data_type,udt_name,is_nullable,column_default,character_maximum_length,numeric_precision,numeric_scale,datetime_precision FROM information_schema.columns WHERE table_schema=current_schema() ORDER BY table_name,ordinal_position`);
 const enums=await tx.$queryRawUnsafe(`SELECT t.typname,e.enumlabel,e.enumsortorder FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname=current_schema() ORDER BY t.typname,e.enumsortorder`);
 const constraints=await tx.$queryRawUnsafe(`SELECT r.relname AS table_name,c.conname,c.contype,c.convalidated,pg_get_constraintdef(c.oid,true) AS definition FROM pg_constraint c JOIN pg_class r ON r.oid=c.conrelid JOIN pg_namespace n ON n.oid=r.relnamespace WHERE n.nspname=current_schema() ORDER BY r.relname,c.conname`);
 const indexes=await tx.$queryRawUnsafe(`SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname=current_schema() ORDER BY tablename,indexname`);
 const counts=[];for(const t of tables){const q='"'+t.tablename.replaceAll('"','""')+'"';const [r]=await tx.$queryRawUnsafe(`SELECT count(*)::text AS count FROM ${q}`);counts.push({table:t.tablename,count:r.count});}
 return {tables,columns,enums,constraints,indexes,counts};
 },{isolationLevel:'RepeatableRead',timeout:60000});}
