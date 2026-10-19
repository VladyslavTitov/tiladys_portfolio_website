// Exact-value scan with no secret output. Run before fixture credential cleanup.
import assert from 'node:assert/strict';import {readFile,readdir,writeFile} from 'node:fs/promises';import {spawnSync} from 'node:child_process';import {join} from 'node:path';
const u=new URL(process.env.DATABASE_URL||'http://missing');assert.equal(u.hostname,'127.0.0.1');assert.equal(u.port,'55432');assert.equal(u.pathname,'/tiladys_rebuild_test');
const f=JSON.parse(await readFile('/tmp/tiladys-complete-qa/fixtures.json','utf8')),secrets=[f.password,f.secretWord,f.token,decodeURIComponent(u.password)].filter(v=>v?.length>=12),leaks=[];let count=0;
async function files(dir){const entries=await readdir(dir,{withFileTypes:true});return(await Promise.all(entries.map(e=>e.isDirectory()?files(join(dir,e.name)):[join(dir,e.name)]))).flat();}
for(const path of await files('docs/qa')){
 let bytes=await readFile(path);if(path.endsWith('.zip')){const r=spawnSync('unzip',['-p',path],{maxBuffer:50*1024*1024});assert.equal(r.status,0);bytes=r.stdout;}
 count++;for(let i=0;i<secrets.length;i++)if(bytes.includes(Buffer.from(secrets[i])))leaks.push({path,keyIndex:i});
}
const tracked=spawnSync('git',['ls-files','-z'],{encoding:'utf8'}).stdout.split('\0').filter(Boolean);for(const path of tracked){const bytes=await readFile(path).catch(()=>Buffer.alloc(0));count++;for(let i=0;i<secrets.length;i++)if(bytes.includes(Buffer.from(secrets[i])))leaks.push({path,keyIndex:i});}
await writeFile('docs/qa/evidence/artifact-secrets.json',JSON.stringify({files:count,knownValues:secrets.length,leaks,scope:'Exact current QA password, phrase, session and local DB password in QA artifacts (including uncompressed trace zip contents) and current tracked files; not history-wide entropy/PII analysis.'},null,2));assert.deepEqual(leaks,[]);console.log(`PASS ${count} artifacts/current tracked files; no exact known credential values.`);
