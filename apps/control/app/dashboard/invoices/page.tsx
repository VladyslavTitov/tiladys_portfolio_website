
import {ControlText} from '@/components/control-language';
import Link from 'next/link';
import {invoicePage} from '@/lib/invoice-list';
import {NewInvoice} from '@/components/new-invoice';
import {requirePageUser} from '@/lib/page-user';
import { db } from '@tiladys/db';
import { defaultBillingSettings, serializeInvoice } from '@/lib/invoices';
import { InvoiceManager } from './invoice-manager';

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  await requirePageUser();
  const query = await searchParams;
  const [result, storedSettings, companies, customers] = await Promise.all([
    invoicePage(query),
    db.businessBillingSettings.findUnique({ where: { id: 'default' } }),
    db.company.findMany({ select: { id: true, name: true, email: true, street: true, postalCode: true, city: true, country: true }, orderBy: { name: 'asc' } }),
    db.customer.findMany({ select: { id: true,customerNumber:true, firstName: true, lastName: true, email: true, street: true, postalCode: true, city: true, country: true } }),
  ]);
  const invoices = result.rows.map((row) => serializeInvoice(row));
  const settings = storedSettings?{...storedSettings,updatedAt:storedSettings.updatedAt.toISOString(),settingsConfirmedAt:storedSettings.settingsConfirmedAt?.toISOString()??null}:defaultBillingSettings;
  return <><nav className="actions" aria-label="Billing resources"><Link href="/dashboard/quotes"><ControlText value="Quotes"/></Link><Link href="/dashboard/invoices" aria-current="page"><ControlText value="Invoices"/></Link></nav><span className="eyebrow"><ControlText value={"Billing"}/></span><h1><ControlText value={"Invoices"}/></h1><p className="admin-intro"><ControlText value={"Prepare drafts, issue frozen invoices, download PDFs, and track partial or full payments."}/></p><form className="record-search"><label><ControlText value={"Search"}/><input name="q" defaultValue={query.q||''} maxLength={120}/></label><label><ControlText value={"Document status"}/><select name="status" defaultValue={query.status||''}><option value=""><ControlText value={"All statuses"}/></option>{['DRAFT','ISSUED','CANCELLED'].map(s=><option key={s}>{s}</option>)}</select></label><label><ControlText value={"Payment status"}/><select name="payment" defaultValue={query.payment||''}><option value=""><ControlText value={"All"}/></option>{['OUTSTANDING','UNPAID','PARTIAL','PAID','OVERDUE'].map(s=><option key={s}>{s}</option>)}</select></label><label><ControlText value={"Issued from (UTC)"}/><input type="date" name="from" defaultValue={query.from||''}/></label><label><ControlText value={"Through (UTC)"}/><input type="date" name="to" defaultValue={query.to||''}/></label><button className="admin-secondary"><ControlText value={"Apply filters"}/></button><Link className="admin-secondary" href="/dashboard/invoices"><ControlText value={"Clear filters"}/></Link></form><nav className="record-pagination" aria-label="Invoice pages">{result.page>1?<Link href={`?${new URLSearchParams({...Object.fromEntries(Object.entries(query).filter(([,v])=>v)),page:String(result.page-1)})}`}><ControlText value={"Previous"}/></Link>:null}<span>{result.page} · {result.total}<ControlText value={" invoices"}/></span>{result.page*25<result.total?<Link href={`?${new URLSearchParams({...Object.fromEntries(Object.entries(query).filter(([,v])=>v)),page:String(result.page+1)})}`}><ControlText value={"Next"}/></Link>:null}</nav><details className="panel new-invoice-panel"><summary><ControlText value="Create invoice draft"/></summary><NewInvoice/></details><InvoiceManager key={JSON.stringify(query)} companies={companies} customers={customers} initialInvoices={invoices as never} initialSettings={settings as never} initialInvoiceId={query.invoiceId ?? ''} /></>;
}
