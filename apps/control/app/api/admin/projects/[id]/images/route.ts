import { NextRequest, NextResponse } from 'next/server';
import { db, Prisma } from '@tiladys/db';
import { requireUser, assertOrigin } from '@/lib/security';
import { MAX_PROJECT_IMAGES, parseProjectImage } from '@/lib/projects';

export const runtime = 'nodejs';
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}) {
 try {
  await assertOrigin();const user=await requireUser();const {id}=await params;
  const form=await req.formData();const imageData=await parseProjectImage(form.get('image'),0);
  const image=await db.$transaction(async tx=>{
   await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Project" WHERE "id"=${id} FOR UPDATE`);
   const project=await tx.project.findUniqueOrThrow({where:{id},select:{status:true,updatedAt:true}});
   if(project.status!=='DRAFT')throw Error('SAVE_DRAFT_BEFORE_MEDIA_EDIT');
   if(form.get('expectedUpdatedAt')!==project.updatedAt.toISOString())throw Error('STALE_WRITE');
   if(await tx.projectImage.count({where:{projectId:id,archivedAt:null}})>=MAX_PROJECT_IMAGES)throw Error('TOO_MANY_IMAGES');
   const maximum=await tx.projectImage.aggregate({where:{projectId:id,archivedAt:null},_max:{sortOrder:true}});
   const image=await tx.projectImage.create({data:{projectId:id,...imageData,sortOrder:(maximum._max.sortOrder??-1)+1},select:{id:true,filename:true,size:true,alt:true,sortOrder:true}});
   const updated=await tx.project.update({where:{id},data:{updatedAt:new Date()},select:{updatedAt:true}});
   await tx.auditLog.create({data:{userId:user.id,action:'PROJECT_IMAGE_CREATE',entity:'Project',entityId:id,metadata:{imageId:image.id}}});
   return {...image,projectUpdatedAt:updated.updatedAt.toISOString(),url:`/api/admin/projects/${id}/images/${image.id}`};
  });
  return NextResponse.json(image,{status:201});
 }catch(error){const message=error instanceof Error?error.message:'IMAGE_UPLOAD_FAILED';return NextResponse.json({error:message},{status:message==='UNAUTHORIZED'?401:message==='INVALID_ORIGIN'?403:message==='STALE_WRITE'?409:400});}
}
