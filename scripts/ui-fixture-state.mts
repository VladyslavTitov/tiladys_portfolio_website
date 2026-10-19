// Temporary visibility states in the existing synthetic test DB only.
import {PrismaClient} from '@tiladys/db';
import {readFile,writeFile,unlink} from 'node:fs/promises';
const url=new URL(process.env.DATABASE_URL||'http://missing');
if(url.hostname!=='127.0.0.1'||url.port!=='55432'||url.pathname!=='/tiladys_rebuild_test')throw Error('SYNTHETIC_DATABASE_REQUIRED');
const path='/tmp/tiladys-v3-checkpoints/publication-state.json';
const db=new PrismaClient();
try {
 if(process.argv[2]==='empty'){
  try{await readFile(path);throw Error('Restore the previous visibility checkpoint first.');}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
  const projects=await db.project.findMany({where:{status:'PUBLISHED'},select:{id:true,status:true}});
  const products=await db.product.findMany({where:{status:'PUBLISHED'},select:{id:true,status:true}});
  await writeFile(path,JSON.stringify({projects,products}),{mode:0o600});
  await db.$transaction([...projects.map(p=>db.project.update({where:{id:p.id},data:{status:'DRAFT'}})),...products.map(p=>db.product.update({where:{id:p.id},data:{status:'DRAFT'}}))]);
  console.log(`Synthetic empty catalogue state: ${projects.length} projects, ${products.length} products retained privately.`);
 }else if(process.argv[2]==='restore'){
  const {projects,products}=JSON.parse(await readFile(path,'utf8')) as {projects:Array<{id:string}>;products:Array<{id:string}>};
  await db.$transaction([...projects.map(p=>db.project.update({where:{id:p.id},data:{status:'PUBLISHED'}})),...products.map(p=>db.product.update({where:{id:p.id},data:{status:'PUBLISHED'}}))]);
  await unlink(path);console.log('Original synthetic publication state restored.');
 }else throw Error('Use empty or restore.');
}finally{await db.$disconnect();}
