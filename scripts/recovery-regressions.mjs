// Reuse existing suites with exact guards redirected only to this incident's owned lab.
import assert from 'node:assert/strict';import {readFile,writeFile,unlink} from 'node:fs/promises';
import {connections,assertWritable,command,evidenceRoot} from './recovery-common.mjs';
const temporary=[];
async function adapted(source,changes){let text=await readFile(source,'utf8');for(const [from,to]of changes){assert.ok(text.includes(from),'Adapter must match exact existing guard/output');text=text.replaceAll(from,to);}const path=source.replace(/\.test\.(ts|mjs)$/,'.recovery-runtime.test.$1');temporary.push(path);await writeFile(path,text);return path;}
async function main(){const c=await connections();assertWritable(c.local,c);await readFile(evidenceRoot+'/financial-preservation.json');
 const crm=await adapted('tests/crm-service-jobs.test.ts',[["assert.match(url.pathname, /^\\/tiladys_crm_test(?:_migrations)?$/);","assert.equal(url.pathname, '/recovery');"],["assert.equal(url.port, '55434');","assert.equal(url.port, '55435');"]]);
 await command(['--import','tsx','--test',crm],c.local,'crm-regression-tests',{env:{CRM_TEST_DATABASE_URL:c.local.href,TSX_TSCONFIG_PATH:'apps/control/tsconfig.json'}});
 const domain=await adapted('tests/rebuild-integration.test.ts',[["url.port!=='55432'||url.pathname!=='/tiladys_rebuild_test'","url.port!=='55435'||url.pathname!=='/recovery'"],["/tmp/tiladys-upload-test","/tmp/tiladys-schema-recovery-20261021/upload-test"]]);
 await command(['--import','tsx','--test',domain],c.local,'invoice-payment-quote-media-regressions',{env:{TSX_TSCONFIG_PATH:'apps/control/tsconfig.json'}});
 const pdf=await adapted('tests/invoice-unicode-pdf.test.ts',[["docs/tiladys-rebuild/implementation/evidence/pdfs",evidenceRoot+'/pdfs'],['/tmp/tiladys-','/tmp/tiladys-recovery-20261021-']]);
 await command(['--import','tsx','--test',pdf,'tests/bilingual-validation.test.ts','tests/invoice-issuance-requirements.test.ts'],c.local,'bilingual-invoice-regressions',{env:{TSX_TSCONFIG_PATH:'apps/control/tsconfig.json'}});
 await command(['node_modules/prisma/build/index.js','migrate','diff','--from-schema-datasource','packages/db/prisma/schema.prisma','--to-schema-datamodel','packages/db/prisma/schema.prisma','--exit-code'],c.local,'local-datamodel-diff');
 await command(['scripts/check-crm-schema.mjs'],c.local,'post-regression-schema-check');console.log('Existing CRM, quote/payment concurrency, immutable invoices, media, bilingual PDF and schema compatibility suites passed against the owned restored lab.');
}
try{await main();}catch(e){console.error('RECOVERY_REGRESSIONS_FAILED:',String(e.message).replace(/postgres(?:ql)?:\/\/[^\s"']+/g,'[REDACTED_DATABASE_URL]'));process.exitCode=1;}finally{for(const path of temporary)await unlink(path);}
