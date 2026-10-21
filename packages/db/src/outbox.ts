import crypto from 'node:crypto';import {Prisma,type PrismaClient} from '@prisma/client';
/** SMTP cannot participate in a database transaction. Reserve first, never resend an uncertain attempt. */
export async function deliverOnce(database:PrismaClient,scope:string,key:string,payload:unknown,send:()=>Promise<void>,record:()=>Promise<unknown>){
 if(!/^[A-Za-z0-9_-]{16,100}$/.test(key))throw Error('INVALID_IDEMPOTENCY_KEY');const hash=crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
 const reservation=await database.$transaction(async tx=>{await tx.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${scope+':'+key}))`);const prior=await tx.emailOutbox.findUnique({where:{scope_key:{scope,key}}});if(prior){if(prior.payloadHash!==hash)throw Error('IDEMPOTENCY_CONFLICT');return {row:prior,created:false};}return {row:await tx.emailOutbox.create({data:{scope,key,payloadHash:hash,state:'SENDING'}}),created:true};});
 if(!reservation.created)return reservation.row.state;
 const id=reservation.row.id;
 try{await send();}catch{await database.emailOutbox.update({where:{id},data:{state:'UNKNOWN',attempts:{create:{outcome:'UNKNOWN'}}}}).catch(()=>{});return 'UNKNOWN';}
 // If recording fails, a retry still sees a reserved attempt and cannot blindly resend.
 try{await database.emailOutbox.update({where:{id},data:{state:'ACCEPTED',attempts:{create:{outcome:'SMTP_ACCEPTED'}}}});}catch{return 'RECORD_FAILED';}
 try{await record();}catch{await database.emailOutbox.update({where:{id},data:{state:'RECORD_FAILED'}}).catch(()=>{});return 'RECORD_FAILED';}
 return 'ACCEPTED';
}
