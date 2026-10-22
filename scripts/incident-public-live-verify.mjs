// Post-rollback reads only. No real Contact enquiry or email is submitted.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {PrismaClient} from '@prisma/client';
import {api,mapping,summary} from './incident-portfolio-inspect.mjs';
import {publicId,controlId,approvedTarget,recoveryEvidence,browserChecks,snapshot,envMetadata,protection} from './incident-public-rollback.mjs';
async function main(){
const before=JSON.parse(await readFile(recoveryEvidence+'/rollback-preconditions.json','utf8'));
const publicProject=api('/v9/projects/'+publicId),control=api('/v9/projects/'+controlId),target=api('/v13/deployments/'+approvedTarget),alias=api('/v4/aliases/tiladys.com');
assert.equal(alias.deploymentId||alias.deployment?.id,approvedTarget,'Live domain does not point to approved deployment');assert.equal(target.readyState,'READY');assert.equal(control.targets.production.id,before.controlProduction.id);
assert.deepEqual(envMetadata(api('/v10/projects/'+publicId+'/env').envs),before.publicEnv);assert.deepEqual(envMetadata(api('/v10/projects/'+controlId+'/env').envs),before.controlEnv);
assert.deepEqual(protection(publicProject),before.publicProtection);assert.deepEqual(protection(control),before.controlProtection);
const checks=await browserChecks('https://tiladys.com',{records:before.before,screenshots:true});await writeFile(recoveryEvidence+'/live-public-verification.json',JSON.stringify(checks,null,2));
const mapped=await mapping(publicId,'production');const db=new PrismaClient({datasourceUrl:mapped.find(e=>e.entry.key==='DATABASE_URL_UNPOOLED').url.href,log:[]});let after;
try{after=await snapshot(db);}finally{await db.$disconnect();}
const preserved={schema:JSON.stringify(after.schema)===JSON.stringify(before.before.schema),migrationHistory:JSON.stringify(after.ledger)===JSON.stringify(before.before.ledger),allTableFingerprints:JSON.stringify(after.fingerprints)===JSON.stringify(before.before.fingerprints)};
assert.ok(preserved.schema&&preserved.migrationHistory&&preserved.allTableFingerprints,'Database preservation check failed');
const result={checkedAt:new Date().toISOString(),liveUrl:'https://tiladys.com',alias:{alias:alias.alias,deploymentId:alias.deploymentId||alias.deployment?.id,projectId:alias.projectId},deployment:summary(target),currentPublicTarget:summary(publicProject.targets.production),controlProduction:summary(control.targets.production),preserved,after,publicEnvironmentUnchanged:true,controlEnvironmentUnchanged:true,deploymentProtectionUnchanged:true,contactRealSubmission:false,publicProtectionTokenStillPendingRevocation:true};await writeFile(recoveryEvidence+'/post-rollback-state.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({status:target.readyState,liveDeployment:result.alias.deploymentId,portfolioCards:checks.portfolioCards,projectDetails:checks.details.length,images:checks.media.length,navigation:checks.navigation,preserved,contact:checks.contact},null,2));
}
main().catch(async e=>{await writeFile(recoveryEvidence+'/live-verification-stopped.log',String(e.stack||e).replace(/postgres(?:ql)?:\/\/[^\s]+/g,'[REDACTED]'));console.error('LIVE_VERIFICATION_STOPPED',e.code||e.name);process.exitCode=1;});
