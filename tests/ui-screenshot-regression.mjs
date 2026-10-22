// Same browser/OS, stable fixture state, after intentional visual review only.
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {browserDriver} from './browser-protocol.mjs';
const b=await browserDriver(),rows=[],dir='docs/ui-evidence/snapshot-check';await mkdir(dir,{recursive:true});
const baselineStage=process.env.UI_BASELINE_STAGE||'handoff-public';assert.match(baselineStage,/^[a-z0-9-]+$/);
try {
 for(const width of [375,1440])for(const route of ['','/about','/contact','/services/websites']){
  await b.viewport(width);await b.navigate(`http://127.0.0.1:3100/en${route}`);
  const name=`public-${route.replaceAll('/','-')||'home'}-${width}`;
  const baseline=await readFile(`docs/ui-evidence/${baselineStage}/${name}.png`),actual=await b.screenshot();
  const [a,c]=await Promise.all([sharp(baseline).ensureAlpha().raw().toBuffer({resolveWithObject:true}),sharp(actual).ensureAlpha().raw().toBuffer({resolveWithObject:true})]);
  const sameSize=a.info.width===c.info.width&&a.info.height===c.info.height;
  let different=0;
  if(sameSize)for(let i=0;i<a.data.length;i+=4)if(Math.max(...[0,1,2].map(j=>Math.abs(a.data[i+j]-c.data[i+j])))>20)different++;
  const fraction=sameSize?different/(a.info.width*a.info.height):1;
  rows.push({name,sameSize,differentPixelFraction:fraction,tolerance:.01});
  if(!sameSize||fraction>.01)await writeFile(`${dir}/${name}-actual.png`,actual);
 }
}finally{await writeFile(`${dir}/results.json`,JSON.stringify({method:'Repeated captures against reviewed final public PNG baselines, same installed Chrome/OS/fixture state, 20/255 channel threshold and <=1% changed pixels; no cross-platform equality claim',rows},null,2));await b.close();}
assert.ok(rows.every(r=>r.sameSize&&r.differentPixelFraction<=.01),JSON.stringify(rows));console.log(JSON.stringify({passed:rows.length,rows}));
