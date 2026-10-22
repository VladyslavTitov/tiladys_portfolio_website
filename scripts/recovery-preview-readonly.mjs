// Incident-specific read-only target guard. Connection values remain private.
import assert from 'node:assert/strict';import {readFile,writeFile} from 'node:fs/promises';import {spawn} from 'node:child_process';import {PrismaClient} from '@prisma/client';
const mode=process.argv[2];assert.ok(['diagnose','check','catalog'].includes(mode));
const entry=JSON.parse(await readFile('/tmp/tiladys-schema-recovery-20261021/preview-direct.private.json','utf8'));
assert.equal(entry.id,'wCTgS9vkb0OPDVBP');assert.equal(entry.key,'DATABASE_URL_UNPOOLED');assert.deepEqual(entry.target,['preview']);
const url=new URL(entry.value);assert.equal(url.hostname,'ep-purple-unit-b1brl6mf.c-5.eu-central-1.aws.neon.tech');assert.equal(url.pathname,'/neondb');assert.equal(url.searchParams.get('schema')||'public','public');assert.equal(url.username,'neondb_owner');
const dir='docs/recovery/2026-10-21/evidence';
if(mode!=='catalog'){
 const command=mode==='diagnose'?'db:diagnose':'db:check:crm';const child=spawn('npm',['run',command],{env:{...process.env,DATABASE_URL:url.href,DIRECT_URL:url.href,DATABASE_URL_UNPOOLED:url.href,SMTP_HOST:'',SMTP_PASSWORD:'',SMTP_FROM:'',CONTACT_AUTO_REPLY_ENABLED:'false'},stdio:['ignore','pipe','pipe']});let output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve);});
 assert.ok(!output.includes(url.password)&&!output.includes(url.href),'Credential output blocked');await writeFile(`${dir}/preview-${mode}.log`,output);console.log(`Read-only ${command} exit ${code}; redacted evidence saved.`);if(mode==='diagnose')assert.equal(code,0);else assert.equal(code,1,'Expected pending-schema release failure before recovery');
}else{
 const db=new PrismaClient({datasourceUrl:url.href,log:[]});try{const data=await db.$transaction(async tx=>{
 await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');await tx.$executeRawUnsafe("SET LOCAL statement_timeout='60s'");
 const identity=await tx.$queryRawUnsafe(`SELECT current_database() AS database,current_schema() AS schema,current_user AS role,current_setting('server_version') AS version,pg_is_in_recovery() AS recovery,has_schema_privilege(current_user,current_schema(),'USAGE') AS schema_usage,has_schema_privilege(current_user,current_schema(),'CREATE') AS schema_create,has_table_privilege(current_user,'"_prisma_migrations"','SELECT') AS ledger_select`);
 const tables=await tx.$queryRawUnsafe(`SELECT tablename,tableowner FROM pg_tables WHERE schemaname=current_schema() ORDER BY tablename`);
 const columns=await tx.$queryRawUnsafe(`SELECT table_name,column_name,data_type,udt_name,is_nullable,column_default,character_maximum_length,numeric_precision,numeric_scale,datetime_precision FROM information_schema.columns WHERE table_schema=current_schema() ORDER BY table_name,ordinal_position`);
 const enums=await tx.$queryRawUnsafe(`SELECT t.typname,e.enumlabel,e.enumsortorder FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname=current_schema() ORDER BY t.typname,e.enumsortorder`);
 const constraints=await tx.$queryRawUnsafe(`SELECT r.relname AS table_name,c.conname,c.contype,c.convalidated,pg_get_constraintdef(c.oid,true) AS definition FROM pg_constraint c JOIN pg_class r ON r.oid=c.conrelid JOIN pg_namespace n ON n.oid=r.relnamespace WHERE n.nspname=current_schema() ORDER BY r.relname,c.conname`);
 const indexes=await tx.$queryRawUnsafe(`SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname=current_schema() ORDER BY tablename,indexname`);
 const ledger=await tx.$queryRawUnsafe(`SELECT migration_name,checksum,finished_at,rolled_back_at,applied_steps_count FROM "_prisma_migrations" ORDER BY started_at`);
 const counts=[];for(const t of tables){if(t.tablename==='_prisma_migrations')continue;const quote='"'+t.tablename.replaceAll('"','""')+'"';const [r]=await tx.$queryRawUnsafe(`SELECT count(*)::text AS count FROM ${quote}`);counts.push({table:t.tablename,count:r.count});}
 return {identity,tables,columns,enums,constraints,indexes,ledger,counts};
 },{isolationLevel:'RepeatableRead',timeout:60000});assert.equal(data.identity[0].database,'neondb');assert.equal(data.identity[0].schema,'public');await writeFile(`${dir}/preview-catalog.json`,JSON.stringify(data,null,2));console.log(JSON.stringify({identity:data.identity,tables:data.tables.length,migrations:data.ledger.length,counts:data.counts},null,2));}catch(e){console.error('[RECOVERY_READONLY_CATALOG_FAILED] details withheld');process.exitCode=1;}finally{await db.$disconnect();}
}
