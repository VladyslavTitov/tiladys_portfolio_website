import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {connections,assertWritable} from './recovery-common.mjs';
import {run} from './recovery-phase4-tests.mjs';
import {evidence,hash} from './recovery-phase4-verify.mjs';
assert.match(process.version,/^v24\./);
const c=await connections();assertWritable(c.local,c);await readFile(evidence+'/migration-result.json');
const npm=resolve(dirname(process.execPath),'../lib/node_modules/npm/bin/npm-cli.js');
const files=['apps/control/next-env.d.ts','apps/web/next-env.d.ts'];const original=await Promise.all(files.map(f=>readFile(f)));
try{
 const env={PATH:dirname(process.execPath)+':'+process.env.PATH,RELEASE_SCHEMA_CHECK:'1',NEXT_TELEMETRY_DISABLED:'1'};
 await run([npm,'run','db:generate'],'generate-prisma-node24',c.local,env);
 await run([npm,'run','build:control'],'build-control-node24',c.local,env);
 await run([npm,'run','build:web'],'build-web-node24',c.local,env);
 await writeFile(evidence+'/build-result.json',JSON.stringify({checkedAt:new Date().toISOString(),node:process.version,vercelNode:'24.x',control:'pass',web:'pass',releaseSchemaCheckEnabled:true,target:'isolated local migrated PostgreSQL18 lab',deploymentCreated:false},null,2));
}finally{
 for(let i=0;i<files.length;i++){const current=await readFile(files[i]);if(!current.equals(original[i])){const expected=original[i].toString().replace('.next/dev/types/routes.d.ts','.next/types/routes.d.ts').replace('.next/dev/types/root-params.d.ts','.next/types/root-params.d.ts');assert.equal(current.toString(),expected,'Unexpected generated next-env edit; preserve for review');await writeFile(files[i],original[i]);}assert.equal(hash(await readFile(files[i])),hash(original[i]));}
}
