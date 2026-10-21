import {db,Prisma} from '@tiladys/db';
import {invoiceInclude} from './invoices';
export async function invoicePage(query:Record<string,string|undefined>) {
 const page=Math.min(10000,Math.max(1,Math.floor(Number(query.page))||1));
 const terms=[Prisma.sql`TRUE`];
 if(query.invoiceId)terms.push(Prisma.sql`i.id=${query.invoiceId.slice(0,100)}`);
 if(query.customerId)terms.push(Prisma.sql`i."customerId"=${query.customerId.slice(0,100)}`);
 if(query.companyId)terms.push(Prisma.sql`i."billingCompanyId"=${query.companyId.slice(0,100)}`);
 if(['DRAFT','ISSUED','CANCELLED'].includes(query.status||''))terms.push(Prisma.sql`i.status::text=${query.status}`);
 if(query.q){const pattern=`%${query.q.slice(0,120).replace(/[\\%_]/g,'\\$&')}%`;terms.push(Prisma.sql`(i."invoiceNumber" ILIKE ${pattern} OR i."recipientName" ILIKE ${pattern} OR i."recipientCompany" ILIKE ${pattern})`);}
 for(const [name,operator]of [['from','>='],['to','<']] as const){const value=query[name];if(value&&/^\d{4}-\d{2}-\d{2}$/.test(value)){const date=new Date(`${value}T00:00:00Z`);if(!Number.isNaN(+date)){if(name==='to')date.setUTCDate(date.getUTCDate()+1);terms.push(Prisma.sql`i."issueDate" ${Prisma.raw(operator)} ${date}`);}}}
 const paid=Prisma.sql`COALESCE(p.paid,0)`;
 if(['UNPAID','PARTIAL','PAID','OVERDUE','OUTSTANDING'].includes(query.payment||'')) {
  terms.push(Prisma.sql`i.status='ISSUED'`);
  if(query.payment==='UNPAID')terms.push(Prisma.sql`${paid}=0 AND i.total>0`);
  if(query.payment==='PARTIAL')terms.push(Prisma.sql`${paid}>0 AND ${paid}<i.total`);
  if(query.payment==='PAID')terms.push(Prisma.sql`${paid}>=i.total`);
  if(query.payment==='OVERDUE')terms.push(Prisma.sql`i."dueDate"<CURRENT_TIMESTAMP AND ${paid}<i.total`);
  if(query.payment==='OUTSTANDING')terms.push(Prisma.sql`${paid}<i.total`);
 }
 const join=Prisma.sql`FROM "Invoice" i LEFT JOIN (SELECT "invoiceId",SUM(amount) AS paid FROM "InvoicePayment" GROUP BY "invoiceId") p ON p."invoiceId"=i.id WHERE ${Prisma.join(terms,' AND ')}`;
 const [ids,count]=await Promise.all([db.$queryRaw<Array<{id:string}>>(Prisma.sql`SELECT i.id ${join} ORDER BY i."createdAt" DESC,i.id ASC LIMIT 25 OFFSET ${(page-1)*25}`),db.$queryRaw<Array<{total:bigint}>>(Prisma.sql`SELECT COUNT(*) AS total ${join}`)]);
 const rows=await db.invoice.findMany({where:{id:{in:ids.map(i=>i.id)}},include:invoiceInclude,omit:{issuedPdf:true}});
 return {page,total:Number(count[0].total),rows:ids.flatMap(i=>{const row=rows.find(r=>r.id===i.id);return row?[row]:[];})};
}
