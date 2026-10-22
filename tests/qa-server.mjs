// Test-boundary launcher; run ONLY through scripts/safe-execution.mjs.
import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
const u=new URL(process.env.DATABASE_URL||'http://missing');assert.equal(u.hostname,'127.0.0.1');assert.equal(u.port,'55432');assert.equal(u.pathname,'/tiladys_rebuild_test');
const mode=process.argv[2];assert.ok(['outage','smtp'].includes(mode));
const env={...process.env};if(mode==='outage'){u.port='1';env.DATABASE_URL=u.href;env.DIRECT_URL=u.href;env.DATABASE_URL_UNPOOLED=u.href;}
else Object.assign(env,{SMTP_HOST:'127.0.0.1',SMTP_PORT:'2525',SMTP_FROM:'qa-sender@example.test',SMTP_REPLY_TO:'qa-reply@example.test',SMTP_USER:'',SMTP_PASSWORD:'',ADMIN_ALERT_EMAIL:'qa-alerts@example.test',NODE_EXTRA_CA_CERTS:'/tmp/tiladys-complete-qa/smtp-cert.pem'});
const c=spawn(process.execPath,['../../node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','-p',mode==='outage'?'3102':'3101'],{cwd:mode==='outage'?'apps/web':'apps/control',env,stdio:'inherit'});
for(const s of ['SIGINT','SIGTERM'])process.on(s,()=>c.kill(s));c.on('exit',code=>process.exitCode=code??1);
