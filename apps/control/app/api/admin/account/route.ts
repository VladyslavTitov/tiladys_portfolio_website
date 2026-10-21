import {requestSource} from '@/lib/request-source';
import {NextRequest} from 'next/server';
import {db,Prisma} from '@tiladys/db';
import argon2 from 'argon2';
import {z} from 'zod';
import {cookies} from 'next/headers';
import {assertOrigin,requireUser,hash,destroySession} from '@/lib/security';
import {privateJson,privateError} from '@/lib/admin-response';
import {loginAllowed} from '@/lib/login-limit';
const schema=z.object({action:z.enum(['PASSWORD','OTHER_SESSIONS','SESSION']),sessionId:z.string().min(1).max(100).optional(),currentPassword:z.string().min(1).max(1000),currentSecret:z.string().min(1).max(1000),newPassword:z.string().min(12).max(200).optional()}).strict();
export async function GET(){try{const user=await requireUser();const raw=(await cookies()).get('tiladys_session')?.value;const rows=await db.session.findMany({where:{userId:user.id,expiresAt:{gt:new Date()}},take:100,orderBy:{createdAt:'desc'},select:{id:true,createdAt:true,expiresAt:true,userAgent:true,tokenHash:true}});return privateJson(rows.map(({tokenHash,...row})=>({...row,current:Boolean(raw&&hash(raw)===tokenHash)})));}catch(e){return privateError(e,'SESSION_LIST_FAILED');}}
export async function POST(req:NextRequest){
 try{
  await assertOrigin();const user=await requireUser();const parsed=schema.safeParse(await req.json());if(!parsed.success)throw Error('INVALID_ACCOUNT_INPUT');const body=parsed.data;
  if(!await loginAllowed(requestSource(req.headers,process.env.AUTH_IP_HEADER),user.email))return privateJson({error:'Too many attempts'},429);
  const valid=await argon2.verify(user.passwordHash,body.currentPassword)&&await argon2.verify(user.secretWordHash,body.currentSecret);if(!valid)return privateJson({error:'Authentication failed'},401);
  const newHash=body.action==='PASSWORD'&&body.newPassword?await argon2.hash(body.newPassword):undefined;if(body.action==='PASSWORD'&&!newHash)throw Error('INVALID_NEW_PASSWORD');if(body.action==='SESSION'&&!body.sessionId)throw Error('INVALID_SESSION_SELECTION');
  const raw=(await cookies()).get('tiladys_session')?.value;let endedCurrent=false;
  await db.$transaction(async tx=>{
   await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "AdminUser" WHERE "id"=${user.id} FOR UPDATE`);
   const current=await tx.adminUser.findUniqueOrThrow({where:{id:user.id},select:{passwordHash:true}});if(current.passwordHash!==user.passwordHash)throw Error('STALE_WRITE');
   if(newHash){await tx.adminUser.update({where:{id:user.id},data:{passwordHash:newHash}});await tx.session.deleteMany({where:{userId:user.id}});}
   else if(body.action==='SESSION'){
    const target=await tx.session.findUniqueOrThrow({where:{id:body.sessionId!,userId:user.id},select:{tokenHash:true}});endedCurrent=Boolean(raw&&hash(raw)===target.tokenHash);await tx.session.delete({where:{id:body.sessionId!,userId:user.id}});
   }else await tx.session.deleteMany({where:{userId:user.id,...(raw?{tokenHash:{not:hash(raw)}}:{})}});
   await tx.auditLog.create({data:{userId:user.id,action:newHash?'PASSWORD_CHANGED':body.action==='SESSION'?'SESSION_REVOKED':'OTHER_SESSIONS_REVOKED',entity:'AdminUser',entityId:user.id}});
  });
  if(newHash||endedCurrent)await destroySession();return privateJson({ok:true,signInRequired:Boolean(newHash||endedCurrent)});
 }catch(e){return privateError(e,'ACCOUNT_OPERATION_FAILED');}
}
