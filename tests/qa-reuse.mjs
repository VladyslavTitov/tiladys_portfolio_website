// Run selected existing regressions with fresh output and private QA credentials.
// The application source and historical evidence are never rewritten.
import assert from 'node:assert/strict';
import {readFile,writeFile,unlink,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
const names={business:'safe-business.mjs',api:'rebuild-api.mjs',interactions:'ui-interactions.mjs',routes:'safe-routes.mjs',secrets:'safe-client-scan.mjs',pdf:'invoice-unicode-pdf.test.ts',query:'portfolio-query.integration.mts',portfolio:'portfolio-redesign.playwright.mjs',editor:'portfolio-editor.playwright.mjs',empty:'portfolio-empty.integration.mts',contact:'contact-buttons.playwright.mjs',mapping:'portfolio-filters.test.ts'};
const key=process.argv[2];assert.ok(names[key], 'Choose a whitelisted existing test');
const root='docs/qa/evidence';await mkdir(root,{recursive:true});
let source=await readFile(`tests/${names[key]}`,'utf8');
source=source.replaceAll('/tmp/tiladys-rebuild/browser-fixtures.json','/tmp/tiladys-complete-qa/fixtures.json').replaceAll('/tmp/tiladys-portfolio-redesign/fixtures.json','/tmp/tiladys-complete-qa/fixtures.json').replaceAll('/tmp/tiladys-portfolio-redesign/empty-state.json','/tmp/tiladys-complete-qa/empty-state.json');
source=source.replaceAll('docs/safe-execution/evidence',`${root}/workflows`).replaceAll('docs/tiladys-rebuild/implementation/evidence',`${root}/existing`).replaceAll('docs/portfolio-redesign-evidence',`${root}/portfolio`).replaceAll('docs/contact-button-evidence',`${root}/contact`).replaceAll('docs/ui-evidence',`${root}/ui`);
// Existing UI test cleared every synthetic contact counter. Do not clear unrelated rows.
source=source.replace("await db.contactRateLimit.deleteMany({where:{NOT:{key:{startsWith:'login:'}}}});",'/* Preserve existing rate-limit rows. */');
if(key==='api')source=source.replace("email:'synthetic-photo@example.test'",'email:fixture.attachmentEmail');
if(key==='empty')source=source.replace("assert.ok(await p.getByRole('heading',{name:'No published projects yet.'}).isVisible());","await p.getByRole('heading',{name:'No published projects yet.',exact:true}).waitFor();");
if(key==='contact')source=source.replace('[375,430,768,1280,1440,1920]','[320,375,390,430,768,1024,1280,1440,1920,2560]');
if(key==='portfolio')source=source.replace('[320,375,430,768,1024,1280,1440,1920]','[320,375,390,430,768,1024,1280,1440,1920,2560]').replace('rows.length,48','rows.length,60');
for(const dir of ['workflows','existing/pdfs','portfolio','contact','ui'])await mkdir(`${root}/${dir}`,{recursive:true});
const suffix=names[key].split('.').pop(),temp=`tests/.qa-runtime-${key}.${suffix}`;
await writeFile(temp,source,{flag:'wx'});
try{
 const args=suffix==='mjs'?[temp,...process.argv.slice(3)]:['--import','tsx',temp,...process.argv.slice(3)];
 const child=spawn(process.execPath,args,{stdio:'inherit',env:{...process.env,TSX_TSCONFIG_PATH:'apps/control/tsconfig.json',INTERACTION_STAGE:'current'}});
 const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve);});process.exitCode=code??1;
}finally{await unlink(temp);}
