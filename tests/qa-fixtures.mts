// Isolated QA records only. Never reuse this script against a configured remote DB.
import {PrismaClient} from '@tiladys/db';
import {readFile,writeFile,unlink} from 'node:fs/promises';
import {randomBytes,randomUUID} from 'node:crypto';
import sharp from 'sharp';
import argon2 from 'argon2';
const url=new URL(process.env.DATABASE_URL||'http://missing');
if(url.hostname!=='127.0.0.1'||url.port!=='55432'||url.pathname!=='/tiladys_rebuild_test')throw Error('SYNTHETIC_DATABASE_REQUIRED');
const path='/tmp/tiladys-complete-qa/fixtures.json',db=new PrismaClient();
const locales=['en','de','fr','sk','uk','ru'];
const text=(value:string)=>Object.fromEntries(locales.map(l=>[l,`${l.toUpperCase()} · ${value}`]));
try {
 if(process.argv[2]==='setup'){
  try{await readFile(path);throw Error('Fixture checkpoint exists');}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
  const prefix=`portfolio-qa-${randomUUID().slice(0,8)}`;
  const photos=await Promise.all(['apps/web/public/services/tiladys-service-website-creation.png','apps/web/public/services/tiladys-service-pc-laptop.webp','apps/web/public/illustrations/g03-practical-prints-1600.webp'].map(async p=>sharp(await readFile(p)).resize({width:720}).webp({quality:75}).toBuffer()));
  const password=randomBytes(32).toString('hex'),secretWord=randomBytes(32).toString('hex'); const hash=await argon2.hash(password),secretHash=await argon2.hash(secretWord); const billingSettings=await db.businessBillingSettings.findUnique({where:{id:'default'}});
  const initial=await db.project.findMany({select:{id:true,status:true,homepageFeatured:true,updatedAt:true}});
  const result=await db.$transaction(async tx=>{
   const user=await tx.adminUser.create({data:{email:`${prefix}@example.test`,displayName:'Isolated portfolio QA',passwordHash:hash,secretWordHash:secretHash}});
   // Authentication is exercised through the actual login endpoint below.
   const records=[];
   const categories=[...Array(14).fill('web-development'),'pc-support','design','google-business','digital-support','data-protection','other','linux-servers','3d-printing','legacy-unclassified','digital-help'];
   for(const [i,category] of categories.entries()){
    const data=photos[category==='3d-printing'?2:category==='web-development'?0:1];
    const row=await tx.project.create({data:{slug:`${prefix}-${i}`,category,status:'PUBLISHED',homepageFeatured:i===0,sortOrder:i,title:text(`QA ${category} ${i}`),summary:text(`${i===0?'Needle 100%_done':'Completed test work'} · Isolated portfolio QA, not a customer case study.`),description:text('Full project description remains on the detail page.'),images:category==='legacy-unclassified'?undefined:{create:[{filename:'qa-cover.webp',mimeType:'image/webp',size:data.length,data,alt:text('Existing TiLADYS artwork reused only in isolated QA'),sortOrder:0},{filename:'qa-secondary.webp',mimeType:'image/webp',size:data.length,data,alt:text('Secondary image'),sortOrder:1}]}},select:{id:true,slug:true,category:true,images:{select:{id:true}}}});records.push(row);
   }
   for(const status of ['DRAFT','ARCHIVED'] as const){const data=photos[1];records.push(await tx.project.create({data:{slug:`${prefix}-${status.toLowerCase()}`,category:'pc-support',status,title:text(`Private needle ${status}`),summary:text('This must never appear publicly.'),images:{create:{filename:'private.webp',mimeType:'image/webp',size:data.length,data}}},select:{id:true,slug:true,category:true,images:{select:{id:true}}}}));}
   return {userId:user.id,records};
  },{timeout:30000});
  const email=`${prefix}@example.test`;
  // Durable checkpoint before any subsequent operation can fail; cleanup never guesses IDs.
  await writeFile(path,JSON.stringify({...result,prefix,email,password,secretWord,initial,billingSettings,publicProductId:null,privateProductId:null}),{mode:0o600});
  const login=await fetch('http://127.0.0.1:3101/api/auth/login',{method:'POST',headers:{origin:'http://127.0.0.1:3101','Content-Type':'application/json'},body:JSON.stringify({email,password,secretWord})});
  if(login.status!==200)throw Error(`QA_REAL_LOGIN_FAILED:${login.status}`);
  const actualToken=login.headers.get('set-cookie')?.match(/tiladys_session=([^;]+)/)?.[1];if(!actualToken)throw Error('QA_LOGIN_COOKIE_MISSING');
  const image=photos[0],attachmentEmail=`qa-attachment-${randomUUID()}@example.test`;
  await db.contactMessage.create({data:{name:'QA attachment',email:attachmentEmail,message:'QA private image; <script>inert</script>',consent:true,attachments:{create:{filename:'qa.webp',mimeType:'image/webp',size:image.length,width:720,height:450,data:image}}}});
  const product=await db.product.create({data:{slug:`${prefix}-template`,type:'FRAMER_TEMPLATE',status:'PUBLISHED',title:text('QA template'),description:text('QA private lab catalogue'),included:text('QA files'),license:text('QA test only'),rightsConfirmed:true,available:false,images:{create:{filename:'qa.webp',mimeType:'image/webp',size:image.length,data:image,alt:text('QA image')}}}});
  await writeFile(path,JSON.stringify({...result,prefix,email,password,secretWord,token:actualToken,initial,billingSettings,publicProductId:product.id,privateProductId:null}),{mode:0o600});
  const privateProduct=await db.product.create({data:{slug:`${prefix}-private`,type:'MODEL_3D',title:text('Private QA model'),description:{},included:{},license:{},images:{create:{filename:'qa.webp',mimeType:'image/webp',size:image.length,data:image,alt:{}}}},include:{images:true}});
  await writeFile(path,JSON.stringify({...result,prefix,token:actualToken,email,password,secretWord,initial,billingSettings,attachmentEmail,publicProductId:product.id,publicProductSlug:product.slug,privateProductId:privateProduct.id,privateProductImage:privateProduct.images[0].id}),{mode:0o600});console.log(`Prepared ${result.records.length} isolated QA projects; initial records unchanged; no SMTP.`);
 }else if(process.argv[2]==='cleanup'){
  const fixture=JSON.parse(await readFile(path,'utf8'));
  const user=await db.adminUser.findUniqueOrThrow({where:{id:fixture.userId}});if(user.email!==`${fixture.prefix}@example.test`)throw Error('Fixture owner mismatch');
  await db.$transaction(async tx=>{await tx.project.updateMany({where:{id:{in:fixture.records.map((r:{id:string})=>r.id)},slug:{startsWith:fixture.prefix}},data:{status:'DRAFT',homepageFeatured:false}});await tx.session.deleteMany({where:{userId:user.id}});await tx.product.updateMany({where:{id:{in:[fixture.publicProductId,fixture.privateProductId].filter(Boolean)}},data:{status:'DRAFT'}});
   if(fixture.billingSettings){const {id,createdAt,...settings}=fixture.billingSettings;await tx.businessBillingSettings.update({where:{id},data:{...settings,updatedAt:new Date(settings.updatedAt),settingsConfirmedAt:settings.settingsConfirmedAt?new Date(settings.settingsConfirmedAt):null}});}});
  const current=await db.project.findMany({where:{id:{in:fixture.initial.map((r:{id:string})=>r.id)}},select:{id:true,status:true,homepageFeatured:true,updatedAt:true}});
  if(current.some(r=>{const old=fixture.initial.find((x:{id:string})=>x.id===r.id);return !old||r.status!==old.status||r.homepageFeatured!==old.homepageFeatured||r.updatedAt.toISOString()!==old.updatedAt;}))throw Error('Initial record changed; investigate before removing checkpoint');
  await unlink(path);console.log('QA projects retained as private drafts; task sessions revoked; initial record state unchanged.');
 }else throw Error('Use setup or cleanup');
}finally{await db.$disconnect();}
