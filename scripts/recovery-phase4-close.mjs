import assert from 'node:assert/strict';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {connections} from './recovery-common.mjs';
import {evidence} from './recovery-phase4-verify.mjs';
const c=await connections();assert.equal(c.container,'tiladys-schema-recovery-20261021');const stopped=[];
for(const pid of (await readdir('/proc')).filter(p=>/^\d+$/.test(p))){try{const args=(await readFile('/proc/'+pid+'/cmdline','utf8')).split('\0');if(args[1]==='scripts/recovery-node24.mjs'&&args[2]==='scripts/recovery-server.mjs'&&['web','control'].includes(args[3])){process.kill(Number(pid),'SIGTERM');stopped.push(args[3]);}}catch(e){if(!['ENOENT','ESRCH','EACCES'].includes(e.code))throw e;}}
assert.deepEqual(stopped.sort(),['control','web']);assert.equal(spawnSync('docker',['stop',c.container],{stdio:'ignore'}).status,0);const state=JSON.parse(spawnSync('docker',['inspect',c.container],{encoding:'utf8'}).stdout)[0];assert.equal(state.State.Running,false);
const backup=JSON.parse(await readFile(evidence+'/backup.json','utf8'));await writeFile(evidence+'/local-cleanup.json',JSON.stringify({checkedAt:new Date().toISOString(),container:c.container,stopped:true,deleted:false,serversStopped:stopped,ports:[3100,3101,55435],freshRestoreDatabaseRetained:backup.restoreDatabase,earlierRecoveryDatabasesRetained:true,otherOwnerProcessesChanged:false,remoteEndpointsChanged:false},null,2));console.log('Only recovery-owned local servers/container stopped; backup restore and all lab data retained.');
