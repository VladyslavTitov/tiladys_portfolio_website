// Isolated QA records only. Never reuse this script against a configured remote DB.
import {PrismaClient} from '@tiladys/db';
import {readFile,writeFile,unlink} from 'node:fs/promises';
import {createHash,randomBytes,randomUUID} from 'node:crypto';
import sharp from 'sharp';
import argon2 from 'argon2';
const url=new URL(process.env.DATABASE_URL||'http://missing');
if(url.hostname!=='127.0.0.1'||url.port!=='55432'||url.pathname!=='/tiladys_rebuild_test')throw Error('SYNTHETIC_DATABASE_REQUIRED');
const path='/tmp/tiladys-portfolio-redesign/fixtures.json',db=new PrismaClient();
const locales=['en','de','fr','sk','uk','ru'];
const text=(value:string)=>Object.fromEntries(locales.map(l=>[l,`${l.toUpperCase()} · ${value}`]));
try {
 if(process.argv[2]==='setup'){
  try{await readFile(path);throw Error('Fixture checkpoint exists');}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
  const prefix=`portfolio-qa-${randomUUID().slice(0,8)}`,token=randomBytes(48).toString('base64url');
  const photos=await Promise.all(['apps/web/public/services/tiladys-service-website-creation.png','apps/web/public/services/tiladys-service-pc-laptop.webp','apps/web/public/illustrations/g03-practical-prints-1600.webp'].map(async p=>sharp(await readFile(p)).resize({width:720}).webp({quality:75}).toBuffer()));
  const hash=await argon2.hash(randomBytes(32).toString('hex'));
  const initial=await db.project.findMany({select:{id:true,status:true,homepageFeatured:true,updatedAt:true}});
  const result=await db.$transaction(async tx=>{
   const user=await tx.adminUser.create({data:{email:`${prefix}@example.test`,displayName:'Isolated portfolio QA',passwordHash:hash,secretWordHash:hash}});
   await tx.session.create({data:{userId:user.id,tokenHash:createHash('sha256').update(token).digest('hex'),expiresAt:new Date(Date.now()+2*3600000)}});
   const records=[];
   const categories=[...Array(14).fill('web-development'),'pc-support','design','google-business','digital-support','data-protection','other','linux-servers','3d-printing','legacy-unclassified','digital-help'];
   for(const [i,category] of categories.entries()){
    const data=photos[category==='3d-printing'?2:category==='web-development'?0:1];
    const row=await tx.project.create({data:{slug:`${prefix}-${i}`,category,status:'PUBLISHED',homepageFeatured:i===0,sortOrder:i,title:text(`QA ${category} ${i}`),summary:text(`${i===0?'Needle 100%_done':'Completed test work'} · Isolated portfolio QA, not a customer case study.`),description:text('Full project description remains on the detail page.'),images:category==='legacy-unclassified'?undefined:{create:[{filename:'qa-cover.webp',mimeType:'image/webp',size:data.length,data,alt:text('Existing TiLADYS artwork reused only in isolated QA'),sortOrder:0},{filename:'qa-secondary.webp',mimeType:'image/webp',size:data.length,data,alt:text('Secondary image'),sortOrder:1}]}},select:{id:true,slug:true,category:true,images:{select:{id:true}}}});records.push(row);
   }
   for(const status of ['DRAFT','ARCHIVED'] as const){const data=photos[1];records.push(await tx.project.create({data:{slug:`${prefix}-${status.toLowerCase()}`,category:'pc-support',status,title:text(`Private needle ${status}`),summary:text('This must never appear publicly.'),images:{create:{filename:'private.webp',mimeType:'image/webp',size:data.length,data}}},select:{id:true,slug:true,category:true,images:{select:{id:true}}}}));}
   return {userId:user.id,records};
  },{timeout:30000});
  await writeFile(path,JSON.stringify({...result,prefix,token,initial}),{mode:0o600});console.log(`Prepared ${result.records.length} isolated QA projects; initial records unchanged; no SMTP.`);
 }else if(process.argv[2]==='cleanup'){
  const fixture=JSON.parse(await readFile(path,'utf8'));
  const user=await db.adminUser.findUniqueOrThrow({where:{id:fixture.userId}});if(user.email!==`${fixture.prefix}@example.test`)throw Error('Fixture owner mismatch');
  await db.$transaction(async tx=>{await tx.project.updateMany({where:{id:{in:fixture.records.map((r:{id:string})=>r.id)},slug:{startsWith:fixture.prefix}},data:{status:'DRAFT',homepageFeatured:false}});await tx.session.deleteMany({where:{userId:user.id}});});
  const current=await db.project.findMany({where:{id:{in:fixture.initial.map((r:{id:string})=>r.id)}},select:{id:true,status:true,homepageFeatured:true,updatedAt:true}});
  if(current.some(r=>{const old=fixture.initial.find((x:{id:string})=>x.id===r.id);return !old||r.status!==old.status||r.homepageFeatured!==old.homepageFeatured||r.updatedAt.toISOString()!==old.updatedAt;}))throw Error('Initial record changed; investigate before removing checkpoint');
  await unlink(path);console.log('QA projects retained as private drafts; task sessions revoked; initial record state unchanged.');
 }else throw Error('Use setup or cleanup');
}finally{await db.$disconnect();}
