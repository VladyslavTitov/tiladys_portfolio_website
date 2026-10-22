// Read-only investigation and proposal. Never changes env, deploys, or provisions.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {PrismaClient} from '@prisma/client';
import {api,mapping,summary} from './incident-portfolio-inspect.mjs';
import {controlId,recoveryEvidence} from './incident-public-rollback.mjs';
import {isTrustedAdminOrigin} from '../apps/control/lib/trusted-origins.ts';
import {checkDatabase} from './check-crm-schema.mjs';
async function main(){
const aliasHost='tiladys-control-git-recovery-vercel-neon-schema-fb31b4-tiladys.vercel.app',aliasOrigin='https://'+aliasHost;
const alias=api('/v4/aliases/'+aliasHost),deployment=api('/v13/deployments/'+(alias.deploymentId||alias.deployment?.id)),project=api('/v9/projects/'+controlId);
assert.equal(deployment.projectId,controlId);assert.equal(deployment.readyState,'READY');assert.notEqual(deployment.target,'production');assert.equal(deployment.meta.githubCommitRef,'recovery/vercel-neon-schema-20261021');
const immutable='https://'+deployment.url,ref=deployment.meta.githubCommitRef;
const entries=api('/v10/projects/'+controlId+'/env').envs.filter(e=>e.target?.includes('preview')&&['CONTROL_URL','CONTROL_ALLOWED_ORIGINS'].includes(e.key));
const config={VERCEL:'1',VERCEL_URL:deployment.url},environment=[];
for(const e of entries){const effective=!e.gitBranch||e.gitBranch===ref;environment.push({key:e.key,gitBranch:e.gitBranch,effective,updatedAt:e.updatedAt});if(effective){const value=api('/v1/projects/'+controlId+'/env/'+e.id);assert.equal(typeof value.value,'string','Origin configuration is unreadable; do not guess a replacement');config[e.key]=value.value;}}
const token=Object.entries(project.protectionBypass||{}).find(([,m])=>m.scope==='automation-bypass'&&m.createdAt===1790060005123)?.[0];assert.ok(token,'Existing Control inspection access required');
const requests=[];for(const origin of [immutable,aliasOrigin]){const response=await fetch(origin+'/api/auth/login',{method:'POST',headers:{'x-vercel-protection-bypass':token,origin,'content-type':'application/json'},body:'{}',redirect:'manual',signal:AbortSignal.timeout(45000)});const body=await response.json();requests.push({origin,status:response.status,error:body.error});}
assert.equal(requests[0].status,400,'Immutable-origin validation behavior changed');assert.equal(requests[1].status,403,'Alias-origin mismatch no longer reproduced');
const allowed=[...(config.CONTROL_ALLOWED_ORIGINS||'').split(',').map(v=>v.trim()).filter(Boolean),aliasOrigin];const proposed={...config,CONTROL_ALLOWED_ORIGINS:[...new Set(allowed)].join(',')};
const tests={immutableAccepted:isTrustedAdminOrigin(immutable,config),aliasCurrentlyRejected:!isTrustedAdminOrigin(aliasOrigin,config),proposedAliasAccepted:isTrustedAdminOrigin(aliasOrigin,proposed),immutableStillAccepted:isTrustedAdminOrigin(immutable,proposed),attackerRejected:!isTrustedAdminOrigin('https://example.invalid',proposed),missingOriginRejected:!isTrustedAdminOrigin(null,proposed),suffixAttackRejected:!isTrustedAdminOrigin(aliasOrigin+'.example.invalid',proposed)};assert.ok(Object.values(tests).every(Boolean));
const mapped=await mapping(controlId,'preview'),url=mapped.find(e=>e.entry.key==='DATABASE_URL').url;assert.equal(url.hostname,'ep-purple-unit-b1brl6mf-pooler.c-5.eu-central-1.aws.neon.tech');
const db=new PrismaClient({datasourceUrl:url.href,log:[]});let accountState;try{await checkDatabase(db);accountState=await db.$transaction(async tx=>{await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');return{administrators:await tx.adminUser.count(),sessions:await tx.session.count()};});assert.equal(accountState.administrators,0);}finally{await db.$disconnect();}
const proposal={projectId:controlId,teamId:project.accountId,operation:'Create or merge only this exact Preview branch origin after separate approval',key:'CONTROL_ALLOWED_ORIGINS',value:proposed.CONTROL_ALLOWED_ORIGINS,type:'plain',target:['preview'],gitBranch:ref};
const result={checkedAt:new Date().toISOString(),deployment:summary(deployment),alias:aliasHost,immutable,environment,requests,tests,accountState,fullPreviewReleaseGuard:'pass, all 23 migrations',proposal,configurationApplied:false,deployed:false,accountsCreated:0,productionAuthenticationTouched:false};await writeFile(recoveryEvidence+'/preview-origin-investigation.json',JSON.stringify(result,null,2));await writeFile(recoveryEvidence+'/preview-origin-proposed-setting.json',JSON.stringify(proposal,null,2));console.log(JSON.stringify(result,null,2));
}
main().catch(e=>{console.error('PREVIEW_ORIGIN_INVESTIGATION_STOPPED',e.code||e.name);process.exitCode=1;});
