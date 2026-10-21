// Fresh PostgreSQL 18 restore/migration laboratory; no existing container adopted.
import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {randomBytes} from 'node:crypto';import {writeFile,mkdir,unlink} from 'node:fs/promises';
const dir='/tmp/tiladys-schema-recovery-20261021',name='tiladys-schema-recovery-20261021',password=randomBytes(32).toString('hex');await mkdir(dir,{recursive:true,mode:0o700});
assert.notEqual(spawnSync('docker',['inspect',name],{stdio:'ignore'}).status,0,'Do not reuse existing lab implicitly');
const file=dir+'/docker-env.private';await writeFile(file,`POSTGRES_USER=tiladys_recovery\nPOSTGRES_PASSWORD=${password}\nPOSTGRES_DB=recovery\n`,{mode:0o600});
try{const r=spawnSync('docker',['run','--detach','--name',name,'--label','purpose=tiladys-schema-recovery-20261021','--publish','127.0.0.1:55435:5432','--env-file',file,'postgres:18-alpine'],{encoding:'utf8'});assert.equal(r.status,0,'Could not start fresh local lab');}finally{await unlink(file);}
const c=JSON.parse(spawnSync('docker',['inspect',name],{encoding:'utf8'}).stdout)[0];assert.equal(c.Config.Image,'postgres:18-alpine');assert.equal(c.NetworkSettings.Ports['5432/tcp'][0].HostPort,'55435');assert.equal(c.NetworkSettings.Ports['5432/tcp'][0].HostIp,'127.0.0.1');
let ready=false;for(let i=0;i<40;i++){if(spawnSync('docker',['exec',name,'pg_isready','-U','tiladys_recovery','-d','recovery'],{stdio:'ignore'}).status===0){ready=true;break;}await new Promise(r=>setTimeout(r,500));}assert.ok(ready);
const u=new URL('postgresql://127.0.0.1:55435/recovery');u.username='tiladys_recovery';u.password=password;await writeFile(dir+'/local-lab.private.json',JSON.stringify({name,url:u.href,role:u.username}),{mode:0o600});
console.log('Fresh PostgreSQL18 lab ready on 127.0.0.1:55435/recovery; exact container metadata and secret checkpoint verified.');
