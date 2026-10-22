// Reuse existing browser/HTTP suites with exact target guards and evidence paths.
import assert from 'node:assert/strict';
import {readFile,writeFile,unlink} from 'node:fs/promises';
import {connections,assertWritable,privateRoot} from './recovery-common.mjs';
import {evidence} from './recovery-phase4-verify.mjs';
import {run} from './recovery-phase4-tests.mjs';
const mode=process.argv[2];assert.ok(['auth','browser'].includes(mode));const c=await connections();assertWritable(c.local,c);
const source=mode==='auth'?'tests/safe-auth.mjs':'scripts/recovery-browser.mjs';let body=await readFile(source,'utf8');
const edits=mode==='auth'?[
 ["assert.equal(url.port, '55432'); assert.equal(url.pathname, '/tiladys_rebuild_test');","assert.equal(url.port, '55435'); assert.equal(url.pathname, '/recovery');"],
 ['/tmp/tiladys-rebuild/browser-fixtures.json',privateRoot+'/browser-fixture.private.json'],
 ['assert.match(fixture.email, /^browser-.*@example\\.test$/);',"assert.equal(fixture.email, 'recovery-browser-20261021@example.test');"],
 ['docs/safe-execution/evidence',evidence]
]:[
 ["import {connections,assertWritable,command,privateRoot,evidenceRoot} from './recovery-common.mjs';",`import {connections,assertWritable,privateRoot} from './recovery-common.mjs';
import {evidence as evidenceRoot} from './recovery-phase4-verify.mjs';
import {run} from './recovery-phase4-tests.mjs';
const command=(args,url,name)=>run(args,name,url);`]
];for(const [from,to]of edits){assert.ok(body.includes(from),'Exact browser adapter missing');body=body.replaceAll(from,to);}
const runtime=source.replace(/\.mjs$/,'.phase4-runtime.mjs');await writeFile(runtime,body);try{await run([runtime,...(mode==='auth'?['after']:[])],mode==='auth'?'authentication-http-tests':'browser-and-business-tests',c.local);}finally{await unlink(runtime);}
