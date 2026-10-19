// Dedicated disposable migration-rehearsal container; never adopts an existing one.
import {spawn,spawnSync} from 'node:child_process';import crypto from 'node:crypto';import {writeFile,unlink} from 'node:fs/promises';
const name=`tiladys-complete-qa-crm-${Date.now()}`,file='/tmp/tiladys-complete-qa/crm-env',password=crypto.randomBytes(32).toString('hex');
if(spawnSync('docker',['container','inspect',name],{stdio:'ignore'}).status===0)throw Error('Container already exists; preserve it and choose an explicitly new lab name.');
await writeFile(file,`POSTGRES_USER=tiladys_test\nPOSTGRES_PASSWORD=${password}\nPOSTGRES_DB=tiladys_crm_test\n`,{mode:0o600});let created=false;
try{
 const start=spawnSync('docker',['run','--detach','--name',name,'--label','tiladys.qa=complete-20261019','--publish','127.0.0.1:55434:5432','--env-file',file,'postgres:17-alpine'],{encoding:'utf8'});if(start.status!==0)throw Error('Could not create isolated CRM lab; no existing container changed.');created=true;
 const c=JSON.parse(spawnSync('docker',['inspect',name],{encoding:'utf8'}).stdout)[0],binding=c.NetworkSettings.Ports['5432/tcp']?.[0];if(c.Config.Image!=='postgres:17-alpine'||binding?.HostIp!=='127.0.0.1'||binding?.HostPort!=='55434')throw Error('Unexpected lab binding.');
 let ready=false;for(let i=0;i<30;i++){if(spawnSync('docker',['exec',name,'pg_isready','-U','tiladys_test','-d','tiladys_crm_test'],{stdio:'ignore'}).status===0){ready=true;break;}await new Promise(r=>setTimeout(r,500));}if(!ready)throw Error('CRM lab not ready.');
 const u=new URL('postgresql://127.0.0.1:55434/tiladys_crm_test');u.username='tiladys_test';u.password=password;
 const child=spawn(process.execPath,['--import','tsx','--test','tests/crm-service-jobs.test.ts'],{stdio:'inherit',env:{...process.env,CRM_TEST_DATABASE_URL:u.href,DATABASE_URL:u.href,DIRECT_URL:u.href,SMTP_HOST:'',SMTP_FROM:'',SMTP_PASSWORD:''}});
 process.exitCode=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',code=>resolve(code??1));});
}finally{await unlink(file);if(created)spawnSync('docker',['stop',name],{stdio:'ignore'});console.log('Exact CRM test container stopped and retained; no production target or pre-existing container changed.');}
