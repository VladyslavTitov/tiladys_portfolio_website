import { NextRequest } from 'next/server';
import { db, Prisma } from '@tiladys/db';
import { assertOrigin, requireUser } from '@/lib/security';
import { parse, taskSchema, taskRelations, transaction, assertRevision } from '@/lib/rebuild-domain';
import { privateJson, privateError } from '@/lib/admin-response';
export async function PATCH(req: NextRequest, { params }: {params:Promise<{id:string}>}) {
 try { await assertOrigin(); const u=await requireUser(); const {id}=await params; const body=await req.json();const expected=body.revision;delete body.revision;const data=parse(taskSchema,body);
 return privateJson(await transaction(db,async tx=>{await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Task" WHERE "id"=${id} FOR UPDATE`);const current=await tx.task.findUniqueOrThrow({where:{id}});assertRevision(current.revision,expected);await taskRelations(tx,data);const row=await tx.task.update({where:{id},data:{...data,dueAt:data.dueAt?new Date(data.dueAt):null,revision:{increment:1}}});await tx.auditLog.create({data:{userId:u.id,action:'TASK_UPDATE',entity:'Task',entityId:id}});return row;}));
 } catch(e) {return privateError(e,'TASK_UPDATE_FAILED');}
}

export async function GET(_req:NextRequest,{params}:{params:Promise<{id:string}>}) {try{await requireUser();return privateJson(await db.task.findUniqueOrThrow({where:{id:(await params).id}}));}catch(e){return privateError(e,'TASK_READ_FAILED');}}
