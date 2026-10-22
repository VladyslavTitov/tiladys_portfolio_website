// Explicitly approved revocation of one incident-created public-project token.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {api,cli,team} from './incident-portfolio-inspect.mjs';
import {publicId,controlId,recoveryEvidence,protection,envMetadata} from './incident-public-rollback.mjs';
import {hash,exactToken} from './incident-token-audit.mjs';
const tokenFingerprints=p=>Object.entries(p.protectionBypass||{}).map(([t,m])=>({sha256:hash(t),...m})).sort((a,b)=>a.sha256.localeCompare(b.sha256));
async function request(url,token){const response=await fetch(url,{headers:{...(token?{'x-vercel-protection-bypass':token}:{}),'cache-control':'no-cache'},redirect:'manual',signal:AbortSignal.timeout(45000)});const body=await response.text();return{status:response.status,vercelAuthentication:body.includes('Authentication Required')||Boolean(response.headers.get('location')?.startsWith('https://vercel.com/')),contactForm:body.includes('contact-form')};}
async function main(){assert.equal(process.argv[2],'--approved-revocation');
const audit=JSON.parse(await readFile(recoveryEvidence+'/unintended-token-audit.json','utf8'));assert.equal(audit.legitimateDependencyFound,false);
const publicProject=api('/v9/projects/'+publicId),control=api('/v9/projects/'+controlId),[token,metadata]=exactToken(publicProject);assert.equal(hash(token),audit.identity.sha256);assert.deepEqual(metadata,Object.fromEntries(Object.entries(audit.identity).filter(([key])=>key!=='sha256')));
const publicEnv=envMetadata(api('/v10/projects/'+publicId+'/env').envs),controlEnv=envMetadata(api('/v10/projects/'+controlId+'/env').envs);
assert.deepEqual(publicEnv,audit.publicEnv);assert.deepEqual(protection(publicProject),audit.publicProtection);assert.deepEqual(protection(control),audit.controlProtection);assert.deepEqual(tokenFingerprints(control),audit.controlTokenFingerprints);
const history=api('/v6/deployments?projectId='+publicId+'&limit=10').deployments;const preview=history.find(d=>d.target!=='production'&&d.state==='READY');assert.ok(preview);const deployment=api('/v13/deployments/'+preview.uid);assert.equal(deployment.projectId,publicId);assert.equal(deployment.readyState,'READY');assert.notEqual(deployment.target,'production');
const protectedUrl='https://'+deployment.url+'/en/contact';const withoutToken=await request(protectedUrl);assert.ok([401,403,302,307].includes(withoutToken.status)&&withoutToken.vercelAuthentication,'Unauthenticated protection is not confirmed; STOP');const withToken=await request(protectedUrl,token);assert.equal(withToken.status,200);assert.equal(withToken.contactForm,true);
const pre={checkedAt:new Date().toISOString(),projectId:publicId,tokenIdentity:audit.identity,protectedDeploymentId:deployment.id,protectedUrl,withoutToken,withToken,otherPublicTokens:tokenFingerprints(publicProject).filter(t=>t.sha256!==audit.identity.sha256),controlTokens:tokenFingerprints(control),publicProtection:protection(publicProject),controlProtection:protection(control),publicEnv,controlEnv,legitimateDependencyFound:false};
await writeFile(recoveryEvidence+'/token-revocation-preconditions.json',JSON.stringify(pre,null,2));
// Exact official request shape, confirmed against the installed CLI. Never put
// the secret in argv, a file, diagnostic output, or a regenerated replacement.
const response=spawnSync(process.execPath,[cli,'api','/v1/projects/'+publicId+'/protection-bypass?teamId='+team,'--method','PATCH','--input','-','--raw','--scope',team,'--non-interactive'],{input:JSON.stringify({revoke:{secret:token,regenerate:false}}),encoding:'utf8',timeout:60000,maxBuffer:8*1024*1024});
assert.equal(response.status,0,'Revocation response uncertain; do not retry blindly');
const after=api('/v9/projects/'+publicId),afterControl=api('/v9/projects/'+controlId);assert.ok(!(token in (after.protectionBypass||{})),'Target token remains');assert.deepEqual(tokenFingerprints(after),pre.otherPublicTokens);assert.deepEqual(tokenFingerprints(afterControl),pre.controlTokens);
assert.deepEqual(protection(after),pre.publicProtection);assert.deepEqual(protection(afterControl),pre.controlProtection);assert.deepEqual(envMetadata(api('/v10/projects/'+publicId+'/env').envs),publicEnv);assert.deepEqual(envMetadata(api('/v10/projects/'+controlId+'/env').envs),controlEnv);
let revokedTokenResponse=await request(protectedUrl,token);if(revokedTokenResponse.status===200){await new Promise(resolve=>setTimeout(resolve,5000));revokedTokenResponse=await request(protectedUrl,token);}
assert.ok([401,403,302,307].includes(revokedTokenResponse.status)&&revokedTokenResponse.vercelAuthentication,'Revoked-token access denial not yet confirmed');const anonymous=await request(protectedUrl);assert.ok(anonymous.vercelAuthentication&&anonymous.status!==200);
const live=await fetch('https://tiladys.com/en/portfolio',{signal:AbortSignal.timeout(45000)});const liveBody=await live.text();assert.equal(live.status,200);assert.ok(liveBody.includes('portfolio-card')&&!liveBody.includes('Projects are temporarily unavailable'));
const result={revokedAt:new Date().toISOString(),projectId:publicId,revokedTokenIdentity:audit.identity,regenerated:false,remainingPublicTokens:tokenFingerprints(after).length,otherTokensUnchanged:true,controlTokensUnchanged:true,protectionSettingsUnchanged:true,configuredEnvironmentVariablesUnchanged:true,protectedUrl,protectedDeploymentId:deployment.id,revokedTokenResponse,anonymousResponse:anonymous,publicPortfolioStatus:live.status,publicPortfolioAvailable:true};
await writeFile(recoveryEvidence+'/token-revocation-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}
main().catch(e=>{console.error('TOKEN_REVOCATION_STOPPED',e.code||e.name,'Inspect metadata before any retry; token values withheld.');process.exitCode=1;});
