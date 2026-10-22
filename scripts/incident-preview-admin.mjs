// Prepared workflow. Default is read-only. Do not use --provision until the user
// explicitly approves this Preview account and supplies its intended email.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import readline from 'node:readline/promises';
import {Writable} from 'node:stream';
import {PrismaClient} from '@prisma/client';
import {checkDatabase} from './check-crm-schema.mjs';
import {api,mapping} from './incident-portfolio-inspect.mjs';

async function main(){
  assert.ok(process.argv.length===2||process.argv.length===3&&process.argv[2]==='--provision','Use no arguments for read-only preflight, or --provision only after explicit approval.');
  const provision=process.argv[2]==='--provision';
  const workflow='scripts/setup-admin.mjs';
  assert.equal(createHash('sha256').update(await readFile(workflow)).digest('hex'),'207510d23e3574e965ef0d8884e9f126f9010f6e4e84907d86b56ffd57cd8e9b','Existing setup-admin workflow changed; review again.');
  const deployment=api('/v13/deployments/dpl_5K9QHNr1z37CoSN97XFTjrouTtDJ');
  assert.equal(deployment.projectId,'prj_6YJMTiWWHE0lX8nzUYCUpA82tEvV');
  assert.equal(deployment.readyState,'READY');assert.notEqual(deployment.target,'production');
  const entries=await mapping(deployment.projectId,'preview');
  assert.equal(entries.length,2);assert.ok(entries.every(e=>!e.entry.gitBranch));
  const url=entries.find(e=>e.entry.key==='DATABASE_URL').url;
  assert.equal(url.hostname,'ep-purple-unit-b1brl6mf-pooler.c-5.eu-central-1.aws.neon.tech');
  assert.equal(url.pathname,'/neondb');assert.equal(url.searchParams.get('schema')||'public','public');
  const db=new PrismaClient({datasourceUrl:url.href,log:[]});
  try{
    await checkDatabase(db);
    const count=await db.$transaction(async tx=>{await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');return tx.adminUser.count();});
    assert.equal(count,0,'Preview already contains an administrator; STOP rather than update it.');
    if(!provision){console.log('Read-only preflight passed: Ready Preview, exact Preview database, complete schema, zero administrators. No account changes.');return;}
    assert.ok(process.stdin.isTTY&&process.stdout.isTTY,'Provisioning requires a private interactive terminal. Never put credentials in arguments or files.');
    console.log('Approval must already cover creation of one intended Preview administrator.');
    let hidden=false;
    const output=new Writable({write(chunk,encoding,done){if(!hidden)process.stdout.write(chunk);done();}});
    const rl=readline.createInterface({input:process.stdin,output,terminal:true});
    let email,password,phrase;
    try{
      email=(await rl.question('Approved Preview admin email: ')).trim().toLowerCase();
      assert.match(email,/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      hidden=true;process.stdout.write('New Preview-only password (hidden): ');password=await rl.question('');process.stdout.write('\n');
      process.stdout.write('New Preview-only secret phrase (hidden): ');phrase=await rl.question('');process.stdout.write('\n');
    }finally{hidden=false;rl.close();}
    assert.ok(password.length>=14&&phrase.length>=10,'Password must have at least 14 characters; phrase at least 10.');
    assert.ok(![email,password,phrase].some(v=>/[\r\n]/.test(v)),'Newlines are not permitted.');
    assert.equal(await db.$transaction(async tx=>{await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');return tx.adminUser.count();}),0,'Preview changed; STOP.');
    // Feed the original workflow one response per prompt. Its stdin is a pipe,
    // so readline cannot echo credentials to the terminal or command logs.
    const child=spawn(process.execPath,[workflow],{env:{...process.env,DATABASE_URL:url.href,DATABASE_URL_UNPOOLED:url.href,DIRECT_URL:url.href},stdio:['pipe','pipe','pipe']});
    const prompts=[['Admin email: ',email],['Admin password: ',password],['Secret phrase: ',phrase]];let buffer='',next=0;
    child.stdout.on('data',chunk=>{buffer+=chunk.toString();while(next<prompts.length&&buffer.includes(prompts[next][0])){buffer=buffer.slice(buffer.indexOf(prompts[next][0])+prompts[next][0].length);child.stdin.write(prompts[next][1]+'\n');next++;}});
    // Exception output may include database details; only report the exit status.
    child.stderr.resume();
    const status=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);});
    password='';phrase='';prompts.length=0;
    assert.equal(status,0,'setup-admin failed. STOP and inspect privately; do not retry an upsert.');
    const result=await db.$transaction(async tx=>{await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');return{count:await tx.adminUser.count(),account:await tx.adminUser.findUnique({where:{email},select:{id:true}})};});
    assert.equal(result.count,1);assert.ok(result.account);
    console.log('Exactly one Preview administrator exists. Verify hosted login and cookie/session behavior next.');
  }finally{await db.$disconnect();}
}
main().catch(()=>{console.error('PREVIEW_ADMIN_WORKFLOW_STOPPED; no automatic retry. Details withheld.');process.exitCode=1;});
