// Existing regression suites; all writable test targets are the retained loopback lab.
import assert from 'node:assert/strict';
import {readFile,writeFile,unlink,copyFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {connections,assertWritable,environment} from './recovery-common.mjs';
import {evidence} from './recovery-phase4-verify.mjs';
const temporary=[];
async function adapted(path,changes){let body=await readFile(path,'utf8');for(const [from,to]of changes){assert.ok(body.includes(from),'Exact suite adapter must match: '+path);body=body.replaceAll(from,to);}const file=path.replace(/\.(ts|mjs)$/,'.phase4-runtime.$1');temporary.push(file);await writeFile(file,body);return file;}
export async function run(args,name,url,extra={}){const c=spawn(process.execPath,args,{env:{...environment(url),...extra},stdio:['ignore','pipe','pipe']});let output='';c.stdout.on('data',b=>output+=b);c.stderr.on('data',b=>output+=b);const code=await new Promise((res,rej)=>{c.on('error',rej);c.on('exit',res);});for(const s of [url.href,url.password,decodeURIComponent(url.password)])if(s)output=output.split(s).join('[REDACTED]');await writeFile(evidence+'/'+name+'.log',output);assert.equal(code,0,name+' failed; inspect sanitized log');console.log(name+': PASS');return output;}
async function main(){
 const c=await connections();assertWritable(c.local,c);await readFile(evidence+'/migration-result.json');const extra={TSX_TSCONFIG_PATH:'apps/control/tsconfig.json'};const results=[];
 async function suite(paths,name,env={}){const previous=process.argv.includes('continue')&&['release-schema-tests','crm-regression-tests','invoice-payment-quote-media-tests','bilingual-invoice-tests'].includes(name);const out=previous?await readFile(evidence+'/'+name+'.log','utf8'):await run(['--import','tsx','--test',...paths],name,c.local,{...extra,...env});assert.match(out,/# fail 0/);assert.match(out,/# skipped 0/);results.push({name,tests:Number(out.match(/# tests (\d+)/)?.[1]),passed:true,skipped:0});}
 await suite(['tests/release-schema.test.mjs'],'release-schema-tests',{RELEASE_TEST_DATABASE_URL:c.local.href});
 const crm=await adapted('tests/crm-service-jobs.test.ts',[["assert.match(url.pathname, /^\\/tiladys_crm_test(?:_migrations)?$/);","assert.equal(url.pathname, '/recovery');"],["assert.equal(url.port, '55434');","assert.equal(url.port, '55435');"]]);await suite([crm],'crm-regression-tests',{CRM_TEST_DATABASE_URL:c.local.href});
 const domain=await adapted('tests/rebuild-integration.test.ts',[["url.port!=='55432'||url.pathname!=='/tiladys_rebuild_test'","url.port!=='55435'||url.pathname!=='/recovery'"],["/tmp/tiladys-upload-test","/tmp/tiladys-schema-recovery-20261021/phase4/upload-test"]]);await suite([domain],'invoice-payment-quote-media-tests');
 const pdf=await adapted('tests/invoice-unicode-pdf.test.ts',[["docs/tiladys-rebuild/implementation/evidence/pdfs",evidence+'/pdfs'],['/tmp/tiladys-','/tmp/tiladys-phase4-20261021-']]);await suite([pdf,'tests/bilingual-validation.test.ts','tests/invoice-issuance-requirements.test.ts'],'bilingual-invoice-tests');
 if(process.argv.includes('continue')){try{await copyFile(evidence+'/database-recovery-tests.log',evidence+'/database-recovery-initial-stale-expectation.log',1);}catch(e){if(e.code!=='EEXIST')throw e;}}
 const recovery=await adapted('tests/schema-recovery.test.ts',[["assert.equal(url.pathname, '/tiladys_schema_recovery');","assert.equal(url.pathname, '/recovery');"],["assert.equal(url.port, '55433');","assert.equal(url.port, '55435');"],
 ["'socialImageId'] AS record","'socialImageId','homepageFeatured'] AS record"],
 ["'SELECT to_jsonb(i) AS record FROM \"ProjectImage\" i ORDER BY id'","`SELECT to_jsonb(i) - 'archivedAt' AS record FROM \"ProjectImage\" i ORDER BY id`"],
 ["to_jsonb(m) - 'status' AS record","to_jsonb(m) - ARRAY['status','customerId','requestMode','requestDetail','replyLanguage','publicReference'] AS record"],
 ['assert.deepEqual(await snapshots(), before);',`assert.deepEqual(await snapshots(), before);
    const [newDefaults] = await db.$queryRawUnsafe<Array<{featured: boolean; image_archive: boolean; message_fields: boolean}>>(\`SELECT
      (SELECT bool_and("homepageFeatured"=false) FROM "Project") AS featured,
      (SELECT bool_and("archivedAt" IS NULL) FROM "ProjectImage") AS image_archive,
      (SELECT bool_and("customerId" IS NULL AND "requestMode" IS NULL AND "requestDetail" IS NULL AND "replyLanguage" IS NULL AND "publicReference" IS NULL) FROM "ContactMessage") AS message_fields\`);
    assert.deepEqual(newDefaults,{featured:true,image_archive:true,message_fields:true});`]
 ]);await suite([recovery],'database-recovery-tests',{SCHEMA_RECOVERY_DATABASE_URL:c.local.href});
 await suite(['tests/rebuild-domain.test.ts','tests/auth-request-source.test.ts','tests/trusted-origins.test.ts','tests/admin-dates.test.ts','tests/portfolio-seo.test.ts','tests/portfolio-filters.test.ts','tests/portfolio-public-routes.test.ts'],'domain-auth-portfolio-tests');
 await run(['scripts/check-crm-schema.mjs'],'local-post-tests-schema-check',c.local);
 await writeFile(evidence+'/test-results.json',JSON.stringify({checkedAt:new Date().toISOString(),scope:'isolated retained PostgreSQL18 loopback lab; no tests write to real Preview or Production',results,tests:results.reduce((n,r)=>n+r.tests,0),skipped:0,originalSuitesUnchanged:true,recoveryAdapter:'Compare original column values, and separately assert homepageFeatured=false and all new nullable image/message fields=NULL. Initial obsolete whole-row expectation retained separately.'},null,2));
}
if(process.argv[1]?.endsWith('/recovery-phase4-tests.mjs'))try{await main();}catch(e){console.error('PHASE4_TESTS_FAILED: '+String(e.message).replace(/postgres(?:ql)?:\/\/[^\s"']+/g,'[REDACTED]'));process.exitCode=1;}finally{for(const p of temporary)await unlink(p);}
