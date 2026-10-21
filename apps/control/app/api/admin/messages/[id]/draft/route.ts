import {NextRequest} from 'next/server';
import {db,Prisma} from '@tiladys/db';
import {z} from 'zod';
import {assertOrigin,requireUser} from '@/lib/security';
import {privateJson,privateError} from '@/lib/admin-response';
import {allocateNumber} from '@/lib/business-records';
import {payloadHash,transaction} from '@/lib/rebuild-domain';
const schema=z.object({kind:z.enum(['JOB','QUOTE']),reviewed:z.literal(true),title:z.string().trim().min(1).max(240),brief:z.string().max(5000),validUntil:z.string().date().optional()}).strict();
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}) {
 try {await assertOrigin();const u=await requireUser();const {id}=await params;const checked=schema.safeParse(await req.json());if(!checked.success)throw Error('INVALID_ENQUIRY_DRAFT');const body=checked.data;
 return privateJson(await transaction(db,async tx=>{
  await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "ContactMessage" WHERE "id"=${id} FOR UPDATE`);
  const message=await tx.contactMessage.findUniqueOrThrow({where:{id}});if(!message.customerId)throw Error('INVALID_LINK_CLIENT_FIRST');
  const scope=`ENQUIRY_DRAFT_${body.kind}`,fingerprint=payloadHash({...body,customerId:message.customerId});
  const previous=await tx.idempotencyRecord.findUnique({where:{scope_key:{scope,key:id}}});if(previous){if(previous.payloadHash!==fingerprint)throw Error('IDEMPOTENCY_CONFLICT');return {id:previous.resultId,kind:body.kind};}
  let resultId:string;
  if(body.kind==='JOB') {const job=await tx.serviceJob.create({data:{customerId:message.customerId,jobNumber:await allocateNumber(tx,'SERVICE_JOB','JOB'),title:body.title,description:body.brief,serviceType:message.service,privateNotes:`Source enquiry: ${id}`}});resultId=job.id;}
  else {if(!body.validUntil)throw Error('INVALID_QUOTE_VALIDITY');const quote=await tx.quote.create({data:{customerId:message.customerId,quoteNumber:await allocateNumber(tx,'QUOTE','Q'),title:body.title,draft:{sourceMessageId:id,customerId:message.customerId,title:body.title,validUntil:body.validUntil,exclusions:body.brief,exclusionsDe:'',lines:[]}}});resultId=quote.id;}
  await tx.idempotencyRecord.create({data:{scope,key:id,payloadHash:fingerprint,resultId}});
  await tx.customerActivity.create({data:{customerId:message.customerId,type:'ENQUIRY_DRAFT_CREATED',summary:`Reviewed enquiry converted to ${body.kind.toLowerCase()} draft`,metadata:{messageId:id,kind:body.kind,resultId},createdById:u.id}});
  await tx.auditLog.create({data:{userId:u.id,action:`ENQUIRY_${body.kind}_DRAFT`,entity:'ContactMessage',entityId:id,metadata:{resultId}}});
  return {id:resultId,kind:body.kind};
 }));}catch(e){return privateError(e,'ENQUIRY_DRAFT_FAILED');}
}
