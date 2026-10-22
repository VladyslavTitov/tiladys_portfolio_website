
import {ControlText} from '@/components/control-language';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {db} from '@tiladys/db';
import {requirePageUser} from '@/lib/page-user';
import {quoteDraftSchema,quoteTotals} from '@/lib/rebuild-domain';

export default async function QuoteDetail({params}:{params:Promise<{id:string}>}) {
 await requirePageUser();
 const q=await db.quote.findUnique({where:{id:(await params).id},include:{revisions:{orderBy:{number:'desc'}},customer:{select:{customerNumber:true,firstName:true,lastName:true,street:true,postalCode:true,city:true,country:true}}}});
 if(!q)notFound();
 const draft=quoteDraftSchema.parse(q.draft);
 const versions=q.status==='DRAFT'?[{id:'draft',number:null,snapshot:{...draft,totals:quoteTotals(draft),recipient:q.customer},createdAt:q.updatedAt},...q.revisions]:q.revisions;
 return <><Link href="/dashboard/quotes"><ControlText value={"← Quotes"}/></Link><h1>{q.quoteNumber} · {q.title}</h1><p>{q.status} · {q.acceptedAt?`Accepted ${q.acceptedAt.toISOString()} via ${q.acceptanceSource}`:'No recorded acceptance'}</p>{q.stateReason?<p><ControlText value={"State reason: "}/>{q.stateReason}</p>:null}{q.serviceJobId?<Link className="admin-primary" href={`/dashboard/service-jobs?jobId=${q.serviceJobId}`}><ControlText value={"Open linked job"}/></Link>:null}{versions.map(r=>{
 const snapshot=r.snapshot as Record<string,unknown>;
 const snap=quoteDraftSchema.parse(Object.fromEntries(Object.entries(snapshot).filter(([key])=>['customerId','title','validUntil','exclusions','exclusionsDe','lines'].includes(key))));
 const totals=snapshot.totals as ReturnType<typeof quoteTotals>;
 const recipient=(snapshot.recipient||{}) as Record<string,string|null>;
 return <section className="panel" key={r.id}><h2>{r.number===null?'Draft preview · not a shared revision':`Frozen revision ${r.number}`}</h2><p><ControlText value={r.number===null?'Last saved':'Shared'}/> {r.createdAt.toISOString()}<ControlText value={" · Valid through "}/>{snap.validUntil}<ControlText value={" at 23:59:59 UTC"}/></p><address>{recipient.firstName} {recipient.lastName}<br/>{recipient.street}<br/>{recipient.postalCode} {recipient.city}<br/>{recipient.country}</address><h3><ControlText value={"Scope / exclusions · Deutsch"}/></h3><p style={{whiteSpace:'pre-wrap'}}>{snap.exclusionsDe||'No German scope supplied.'}</p><h3><ControlText value={"Scope / exclusions · English"}/></h3><p style={{whiteSpace:'pre-wrap'}}>{snap.exclusions||'—'}</p><div className="price-sheet-table-wrap"><table><thead><tr><th><ControlText value={"German / English service"}/></th><th><ControlText value={"Quantity"}/></th><th><ControlText value={"Agreed unit price"}/></th></tr></thead><tbody>{snap.lines.map((line,index)=><tr key={index}><td>{line.serviceNameDe}<br/>{line.serviceName}<p>{line.descriptionDe}<br/>{line.description}</p></td><td>{line.quantity} {line.unitDe} / {line.unit}</td><td>{line.unitPrice} EUR</td></tr>)}</tbody></table></div><p><ControlText value={"Subtotal: "}/>{totals.subtotal} EUR · {totals.total===null?'Tax unconfirmed':`Total: ${totals.total} EUR`}</p><p><ControlText value={"This quote is a proposal. An invoice is created and issued separately."}/></p></section>;
 })}</>;
}
