import { Prisma, db } from '@tiladys/db';
import { invoiceInclude,parsePayment } from './invoices';
import {transaction,payloadHash} from './rebuild-domain';
export async function recordPayment(database:typeof db,id:string,body:unknown,key:string,actor:string){
 if(!/^[A-Za-z0-9_-]{16,100}$/.test(key))throw Error('INVALID_IDEMPOTENCY_KEY');const data=parsePayment(body);const fingerprint=payloadHash({...data,amount:data.amount.toString(),paidAt:data.paidAt.toISOString()});
 return transaction(database,async tx=>{await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Invoice" WHERE "id"=${id} FOR UPDATE`);
 const current=await tx.invoice.findUniqueOrThrow({where:{id},include:{payments:true},omit:{issuedPdf:true}});
 const prior=await tx.invoicePayment.findUnique({where:{invoiceId_idempotencyKey:{invoiceId:id,idempotencyKey:key}}});
 if(prior){if(prior.payloadHash!==fingerprint)throw Error('IDEMPOTENCY_CONFLICT');return tx.invoice.findUniqueOrThrow({where:{id},include:invoiceInclude,omit:{issuedPdf:true}});}
 if(current.status!=='ISSUED')throw Error('PAYMENT_REQUIRES_ISSUED_INVOICE');if(data.amount.lte(0))throw Error('INVALID_PAYMENT_AMOUNT');const paid=current.payments.reduce((sum,p)=>sum.add(p.amount),new Prisma.Decimal(0));if(paid.add(data.amount).gt(current.total))throw Error('PAYMENT_EXCEEDS_BALANCE');
 await tx.invoicePayment.create({data:{invoiceId:id,...data,createdById:actor,idempotencyKey:key,payloadHash:fingerprint}});await tx.auditLog.create({data:{userId:actor,action:'INVOICE_PAYMENT_CREATE',entity:'Invoice',entityId:id,metadata:{amount:data.amount.toString(),paidAt:data.paidAt.toISOString()}}});return tx.invoice.findUniqueOrThrow({where:{id},include:invoiceInclude,omit:{issuedPdf:true}});
 });
}
