import {connections,assertWritable,command,evidenceRoot} from './recovery-common.mjs';import {readFile,writeFile} from 'node:fs/promises';
async function main(){const c=await connections();assertWritable(c.local,c);await readFile(evidenceRoot+'/financial-preservation.json');const npm=process.env.RECOVERY_NPM_CLI||'/usr/lib/node_modules_22/npm/bin/npm-cli.js',suffix=process.version.startsWith('v24.')?'-node24':'';
 await command([npm,'run','db:generate'],c.local,'regenerate-prisma'+suffix);
 await command([npm,'run','build:control'],c.local,'build-control'+suffix,{env:{RELEASE_SCHEMA_CHECK:'1',NEXT_TELEMETRY_DISABLED:'1'}});
 await command([npm,'run','build:web'],c.local,'build-web'+suffix,{env:{RELEASE_SCHEMA_CHECK:'1',NEXT_TELEMETRY_DISABLED:'1'}});
 await writeFile(evidenceRoot+'/build-result'+suffix+'.json',JSON.stringify({node:process.version,vercelNode:'24.x',localNodeMajorMatchesVercel:!!suffix,control:'pass with RELEASE_SCHEMA_CHECK=1',web:'pass',database:'isolated restored and migrated PostgreSQL 18; no remote build/deploy',releaseGuardDisabled:false},null,2));console.log('Both production builds passed with generated Prisma and the Control release guard enabled. Runtime details recorded.');}
main().catch(e=>{console.error('RECOVERY_BUILD_FAILED:',e.message);process.exitCode=1;});
