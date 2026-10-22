import crypto from 'node:crypto';
import { z } from 'zod';
import { Prisma, type PrismaClient } from '@tiladys/db';
import { invoiceLineSchema, locales } from '@tiladys/shared';
import { allocateNumber } from './business-records';
import { calculateInvoiceLines,defaultBillingSettings,sellerSnapshot } from './invoices';

const text = z.string().trim().min(1).max(240);
const optional = z.string().max(10000).optional().default('');
const revision = z.number().int().positive();
const translated = z.object(Object.fromEntries(locales.map(l => [l, z.string().max(10000).optional()])) as Record<typeof locales[number], z.ZodOptional<z.ZodString>>).strict();
const money = z.string().regex(/^\d{1,9}(?:\.\d{1,2})?$/);
export const quoteDraftSchema = z.object({ sourceMessageId:z.string().max(100).optional(),customerId: text, title: text, validUntil: z.string().date(), exclusions: optional, exclusionsDe: optional, lines: z.array(invoiceLineSchema).max(100) }).strict();
export const taskSchema = z.object({ timeZone:z.string().max(100).refine(value=>{try{new Intl.DateTimeFormat('en',{timeZone:value});return true;}catch{return false;}},'Choose a valid IANA timezone.').default('UTC'), title: text, description: optional, status: z.enum(['TODO','IN_PROGRESS','DONE','ARCHIVED']), priority: z.number().int().min(0).max(2), dueAt: z.string().datetime().nullable(), customerId: z.string().max(100).nullable(), serviceJobId: z.string().max(100).nullable() }).strict();
export const productSchema = z.object({ slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100).refine(s => !['framer','3d-models'].includes(s)), type: z.enum(['FRAMER_TEMPLATE','MODEL_3D']), status: z.enum(['DRAFT','PUBLISHED','ARCHIVED']), title: translated, description: translated, included: translated, license: translated, price: money.nullable(), currency: z.literal('EUR'), priceConfirmed: z.boolean(), demoUrl: z.string().max(2048).nullable(), purchaseUrl: z.string().max(2048).nullable(), available: z.boolean(), rightsConfirmed: z.boolean(), sortOrder: z.number().int().min(-10000).max(10000) }).strict();
export function parse<T>(schema: z.ZodType<T>, value: unknown): T {
 const result = schema.safeParse(value);
 if (!result.success) throw Object.assign(new Error('INVALID_INPUT'), { details: z.flattenError(result.error) });
 return result.data;
}
export const changeSchema = z.object({ revision, action: z.enum(['save','send','accept','decline','archive','expire','convert','invoice']), draft: quoteDraftSchema.optional(),reason:z.string().trim().min(1).max(1000).optional(), acceptedRevisionId: z.string().optional(), acceptedAt: z.string().datetime().optional(), source: z.string().trim().min(1).max(200).optional(), reference: z.string().trim().min(1).max(1000).optional() }).strict();
export function safeExternalUrl(value: string | null) {
 if (!value) return null;
 try {
  const url = new URL(value); const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !host.includes('.') || host.endsWith('.local') || host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(':')) throw new Error();
  return url.href;
 } catch { throw new Error('INVALID_EXTERNAL_URL'); }
}
export async function transaction<T>(database: PrismaClient, work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
 for (let attempt = 0; ; attempt++) {
  try { return await database.$transaction(work, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 }); }
  catch (error) { const retryable = error instanceof Prisma.PrismaClientKnownRequestError && (error.code === 'P2034' || error.code === 'P2010' && ['40001','40P01'].includes(String(error.meta?.code))); if (!retryable || attempt >= 3) throw error; }
 }
}
export function assertRevision(actual: number, expected: number) { if (actual !== expected) throw new Error('STALE_WRITE'); }
export const payloadHash = (value: unknown) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function quoteTotals(draft: z.infer<typeof quoteDraftSchema>) {
 const lines = calculateInvoiceLines(draft.lines);
 const subtotal = lines.reduce((s,l) => s.add(l.subtotal), new Prisma.Decimal(0));
 const tax = lines.some(l => l.taxAmount === null) ? null : lines.reduce((s,l) => s.add(l.taxAmount ?? 0), new Prisma.Decimal(0));
 return { subtotal: subtotal.toString(), tax: tax?.toString() ?? null, total: tax === null ? null : subtotal.add(tax).toString() };
}
export async function createQuote(database: PrismaClient, value: unknown, actor: string) {
 const draft = parse(quoteDraftSchema, value); quoteTotals(draft);
 return transaction(database, async tx => {
  await tx.customer.findUniqueOrThrow({ where: { id: draft.customerId } });
  if(draft.sourceMessageId&&!await tx.contactMessage.findFirst({where:{id:draft.sourceMessageId,customerId:draft.customerId},select:{id:true}}))throw Error('INVALID_QUOTE_SOURCE');
  const quoteNumber = await allocateNumber(tx, 'QUOTE', 'Q');
  const row = await tx.quote.create({ data: { customerId: draft.customerId, title: draft.title, quoteNumber, draft: draft as Prisma.InputJsonValue } });
  await tx.auditLog.create({ data: { userId: actor, action: 'QUOTE_CREATE', entity: 'Quote', entityId: row.id } }); return row;
 });
}
export async function changeQuote(database: PrismaClient, id: string, value: unknown, actor: string) {
 const change = parse(changeSchema, value);
 return transaction(database, async tx => {
  await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Quote" WHERE "id"=${id} FOR UPDATE`);
  const row = await tx.quote.findUniqueOrThrow({ where: { id }, include: { revisions: { orderBy: { number: 'desc' } } } });
  // Accepted conversion replay has a stable result identity even after the revision advances.
  if (change.action === 'convert' && row.serviceJobId && change.acceptedRevisionId === row.acceptedRevisionId) return row;
  if(change.action==='invoice'&&row.acceptedRevisionId){const invoice=await tx.invoice.findUnique({where:{quoteRevisionId:row.acceptedRevisionId},select:{id:true}});if(invoice&&change.acceptedRevisionId===row.acceptedRevisionId)return {...row,invoiceId:invoice.id};}
  assertRevision(row.revision, change.revision);
  let update: Prisma.QuoteUpdateInput = { revision: { increment: 1 } };
  const draft = parse(quoteDraftSchema, row.draft);
  if (change.action === 'save') {
   if (!['DRAFT','SENT'].includes(row.status) || !change.draft || change.draft.customerId !== row.customerId) throw new Error('INVALID_QUOTE_STATE');
   if(change.draft.sourceMessageId!==draft.sourceMessageId)throw Error('INVALID_QUOTE_SOURCE');
   quoteTotals(change.draft); update = { ...update, title: change.draft.title, draft: change.draft as Prisma.InputJsonValue, status: 'DRAFT' };
  } else if (change.action === 'send') {
   if (row.status !== 'DRAFT' || !draft.lines.length || new Date(`${draft.validUntil}T23:59:59.999Z`) < new Date()) throw new Error('INVALID_QUOTE_STATE');
   const customer = await tx.customer.findUniqueOrThrow({ where: { id: row.customerId }, select: { customerNumber: true, firstName: true, lastName: true, companyId: true, street: true, postalCode: true, city: true, country: true } });
   await tx.quoteRevision.create({ data: { quoteId: id, number: (row.revisions[0]?.number ?? 0) + 1, snapshot: { ...draft, totals: quoteTotals(draft), recipient: customer } as Prisma.InputJsonValue, validUntil: new Date(`${draft.validUntil}T23:59:59.999Z`), recordedById: actor } });
   // Records an externally shared quote. SMTP transmission is a separate operation.
   update.status = 'SENT';
  } else if (change.action === 'accept') {
   const sent = row.revisions[0];
   if (row.status !== 'SENT' || !sent || sent.id !== change.acceptedRevisionId || sent.validUntil < new Date() || !change.acceptedAt || new Date(change.acceptedAt) > new Date() || !change.source || !change.reference) throw new Error('INVALID_QUOTE_ACCEPTANCE');
   update = { ...update, status: 'ACCEPTED', acceptedRevision: { connect: { id: sent.id } }, acceptedAt: new Date(change.acceptedAt), acceptanceSource: change.source, acceptanceReference: change.reference };
  } else if (change.action === 'convert' || change.action === 'invoice') {
   if (row.status !== 'ACCEPTED' || row.acceptedRevisionId !== change.acceptedRevisionId) throw new Error('INVALID_QUOTE_STATE');
   const frozen = row.revisions.find(r => r.id === row.acceptedRevisionId); if (!frozen) throw new Error('INVALID_QUOTE_STATE');
   const snap = parse(quoteDraftSchema, Object.fromEntries(Object.entries(frozen.snapshot as Record<string, unknown>).filter(([k]) => ['sourceMessageId','customerId','title','validUntil','exclusions','exclusionsDe','lines'].includes(k))));
   const lines = calculateInvoiceLines(snap.lines);
   const job = row.serviceJobId ? await tx.serviceJob.findUniqueOrThrow({where:{id:row.serviceJobId}}) : await tx.serviceJob.create({ data: { customerId: row.customerId, jobNumber: await allocateNumber(tx, 'SERVICE_JOB', 'JOB'), title: snap.title, description: [snap.exclusionsDe,snap.exclusions].filter(Boolean).join('\n\n'), lineItems: { create: lines.map(l => ({ serviceName: l.serviceName, serviceNameDe: l.serviceNameDe, description: l.description, descriptionDe: l.descriptionDe, unit: l.unit, unitDe: l.unitDe, quantity: l.quantity, agreedUnitPrice: l.unitPrice, taxTreatment: l.taxTreatment, taxRate: l.taxRate, subtotal: l.subtotal, taxAmount: l.taxAmount, total: l.total, cataloguePriceMode: l.priceMode, priceConfirmed: l.priceConfirmed, billingPeriodFrom: l.billingPeriodFrom, billingPeriodTo: l.billingPeriodTo, sortOrder: l.sortOrder })) } } });
   if(job.customerId!==row.customerId)throw Error('INVALID_QUOTE_JOB_RELATIONSHIP');
   update.serviceJob = { connect: { id: job.id } };
   if(change.action==='invoice'){
    const settings=await tx.businessBillingSettings.findUnique({where:{id:'default'}})??defaultBillingSettings;
    const customer=await tx.customer.findUniqueOrThrow({where:{id:row.customerId}});
    const subtotal=lines.reduce((s,l)=>s.add(l.subtotal),new Prisma.Decimal(0));const taxTotal=lines.some(l=>l.taxAmount===null)?null:lines.reduce((s,l)=>s.add(l.taxAmount??0),new Prisma.Decimal(0));
    const existing=await tx.invoice.findFirst({where:{serviceJobId:job.id,status:'DRAFT'}});
    if(existing)throw Error('INVALID_EXISTING_JOB_DRAFT');
    const invoice=await tx.invoice.create({data:{quoteRevisionId:frozen.id,customerId:row.customerId,serviceJobId:job.id,documentVersion:3,...sellerSnapshot(settings),recipientName:[customer.firstName,customer.lastName].filter(Boolean).join(' ')||customer.customerNumber,recipientStreet:customer.street||'',recipientPostalCode:customer.postalCode||'',recipientCity:customer.city||'',recipientCountry:customer.country,recipientEmail:customer.email,issueDate:new Date(),customerReference:row.quoteNumber,subtotal,taxTotal,total:subtotal.add(taxTotal??0),lines:{create:lines}}});
    const changed=await tx.quote.update({where:{id},data:update,include:{revisions:{orderBy:{number:'desc'}}}});await tx.auditLog.create({data:{userId:actor,action:'QUOTE_INVOICE_DRAFT',entity:'Invoice',entityId:invoice.id,metadata:{quoteRevisionId:frozen.id}}});return {...changed,invoiceId:invoice.id};
   }
  } else {
   if (row.status === 'ACCEPTED' || row.serviceJobId) throw new Error('INVALID_QUOTE_STATE');
   if(!change.reason)throw Error('INVALID_STATE_REASON');
   if(change.action==='expire'&&(row.status!=='SENT'||!row.revisions[0]||row.revisions[0].validUntil>=new Date()))throw Error('INVALID_QUOTE_STATE');
   update.status = change.action === 'decline' ? 'DECLINED' : change.action === 'expire' ? 'EXPIRED' : 'ARCHIVED';
   update.stateReason=change.reason;
  }
  const changed = await tx.quote.update({ where: { id }, data: update, include: { revisions: { orderBy: { number: 'desc' } } } });
  await tx.auditLog.create({ data: { userId: actor, action: `QUOTE_${change.action.toUpperCase()}`, entity: 'Quote', entityId: id, metadata: { revision: changed.revision } } }); return changed;
 });
}
export async function taskRelations(tx: Prisma.TransactionClient, data: z.infer<typeof taskSchema>) {
 if (data.customerId) await tx.customer.findUniqueOrThrow({ where: { id: data.customerId } });
 if (data.serviceJobId) { const job = await tx.serviceJob.findUniqueOrThrow({ where: { id: data.serviceJobId }, select: { customerId: true } }); if (!data.customerId || data.customerId !== job.customerId) throw new Error('INVALID_TASK_RELATIONSHIP'); }
}
export function productData(value: unknown) {
 const data = parse(productSchema, value);
 const demoUrl = safeExternalUrl(data.demoUrl); const purchaseUrl = safeExternalUrl(data.purchaseUrl);
 if (data.status === 'PUBLISHED') {
  if (!data.rightsConfirmed || !locales.some(l => data.title[l]?.trim() && data.description[l]?.trim() && data.license[l]?.trim() && data.included[l]?.trim())) throw new Error('INVALID_PRODUCT_PUBLICATION');
  if (data.available && (!purchaseUrl || !data.priceConfirmed || data.price === null)) throw new Error('INVALID_PRODUCT_AVAILABILITY');
 }
 return { ...data, demoUrl, purchaseUrl, price: data.price === null ? null : new Prisma.Decimal(data.price) };
}
