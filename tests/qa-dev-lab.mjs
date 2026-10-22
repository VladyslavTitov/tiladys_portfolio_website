// Fresh source copies, no .env files and no owner .next/dev lock touched.
// Invoke through safe-execution; production artifacts are never reused as dev output.
import assert from 'node:assert/strict';import {cp,mkdir,readFile,writeFile,symlink,access} from 'node:fs/promises';import {spawn} from 'node:child_process';import {resolve} from 'node:path';
const u=new URL(process.env.DATABASE_URL||'http://missing');assert.equal(u.hostname,'127.0.0.1');assert.equal(u.port,'55432');assert.equal(u.pathname,'/tiladys_rebuild_test');
const app=process.argv[2];assert.ok(['web','control'].includes(app));const root=resolve('.qa-complete-dev'),dest=`${root}/${app}`;await mkdir(root,{recursive:true});
try{await access(dest);throw Error('Fresh dev copy required; preserve previous lab before rerunning');}catch(e){if(e.code!=='ENOENT')throw e;}
await cp(`apps/${app}`,dest,{recursive:true,filter:path=>!path.split('/').some(part=>part==='node_modules'||part==='.next'||part.startsWith('.env')||part.endsWith('.tsbuildinfo'))});
await symlink(resolve('node_modules'),`${dest}/node_modules`,'dir');
const config=`${dest}/next.config.ts`,text=await readFile(config,'utf8');await writeFile(config,text.replace('reactStrictMode: true,',`reactStrictMode: true,\n  turbopack: { root: ${JSON.stringify(process.cwd())} },`));
const c=spawn(process.execPath,[resolve('node_modules/next/dist/bin/next'),'dev','--turbopack','--hostname','127.0.0.1','-p',app==='web'?'3104':'3105'],{cwd:dest,env:process.env,stdio:'inherit'});for(const s of ['SIGINT','SIGTERM'])process.on(s,()=>c.kill(s));c.on('exit',code=>process.exitCode=code??1);
