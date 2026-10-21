import crypto from 'node:crypto';
import {z} from 'zod';
import {Prisma,type PrismaClient} from '@tiladys/db';
import {defaultBillingSettings,sellerSnapshot,invoiceInclude} from './invoices';
const schema=z.object({kind:z.literal('STANDALONE'),customerId:z.string().min(1).max(100)}).strict();
export async function standaloneInvoice(database:PrismaClient,value:unknown,key:string,actor:string) {
 const checked=schema.safeParse(value);if(!checked.success)throw Error('INVALID_STANDALONE_DRAFT');const body=checked.data;const fingerprint=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');if(!/^[a-f0-9-]{36}$/i.test(key))throw Error('INVALID_IDEMPOTENCY_KEY');
 return database.$transaction(async tx=>{
  const scope=`STANDALONE_INVOICE:${actor}`;
  await tx.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended(${scope+key},0))`);
  const previous=await tx.idempotencyRecord.findUnique({where:{scope_key:{scope,key}}});
  if(previous){if(previous.payloadHash!==fingerprint)throw Error('IDEMPOTENCY_CONFLICT');return tx.invoice.findUniqueOrThrow({where:{id:previous.resultId},include:invoiceInclude});}
  const customer=await tx.customer.findUniqueOrThrow({where:{id:body.customerId}});if(customer.status==='ARCHIVED')throw Error('INVALID_ARCHIVED_CUSTOMER');
  const settings=await tx.businessBillingSettings.findUnique({where:{id:'default'}})??defaultBillingSettings;
  const row=await tx.invoice.create({data:{...sellerSnapshot(settings),documentVersion:3,customerId:customer.id,billingRecipientType:'INDIVIDUAL',recipientName:[customer.firstName,customer.lastName].filter(Boolean).join(' ')||customer.customerNumber,recipientEmail:customer.email,recipientStreet:customer.street||'',recipientPostalCode:customer.postalCode||'',recipientCity:customer.city||'',recipientCountry:customer.country,issueDate:new Date(),subtotal:0,taxTotal:null,total:0},include:invoiceInclude});
  await tx.idempotencyRecord.create({data:{scope,key,payloadHash:fingerprint,resultId:row.id}});
  await tx.auditLog.create({data:{userId:actor,action:'INVOICE_STANDALONE_DRAFT_CREATE',entity:'Invoice',entityId:row.id}});
  return row;
 });
}
