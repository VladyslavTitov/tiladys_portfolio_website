'use client';
import {ControlText} from '@/components/control-language';


import Link from 'next/link';
import { useUnsavedChanges } from '@/lib/use-unsaved-changes';
import { useRef, useState } from 'react';
import { Plus, Search, UserRound } from 'lucide-react';

type Company = { id: string; name: string };
type Customer = { id: string; customerNumber: string; type: string; status: string; firstName: string | null; lastName: string | null; email: string | null; phone: string | null; updatedAt: string; company: Company | null; _count: { serviceJobs: number } };
const empty = { type: 'PERSON', status: 'LEAD', firstName: '', lastName: '', companyId: '', email: '', phone: '', secondaryPhone: '', street: '', postalCode: '', city: '', country: 'DE', preferredLanguage: 'de', source: '', notes: '' };

export function CustomerManager({ initialCustomers, companies, initialQuery }: { initialQuery:{q?:string;status?:string;type?:string;new?:string}; initialCustomers: Customer[]; companies: Company[] }) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [query, setQuery] = useState(initialQuery.q||'');
  const [showForm, setShowForm] = useState(initialQuery.new==='1');
  const [draft, setDraft] = useState(empty);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false); const [errors, setErrors] = useState<Record<string, string[]>>({}); const [status, setStatus] = useState(initialQuery.status||'');const [type,setType]=useState(initialQuery.type||'');
  useUnsavedChanges(JSON.stringify(draft) !== JSON.stringify(empty));
  const filtered = customers;

  const name = (c: Customer) => [c.firstName, c.lastName].filter(Boolean).join(' ') || c.company?.name || 'Unnamed customer';
  async function createCustomer(event: React.FormEvent) {
    event.preventDefault(); if (lock.current) return; lock.current = true; setErrors({}); setBusy(true); setMessage('Saving customer…');
    try {
      const response = await fetch('/api/admin/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
      const data = await response.json(); if (!response.ok) { setErrors(data.details?.fieldErrors ?? {}); throw new Error(data.error ?? `HTTP ${response.status}`); }
      const created: Customer = { ...data, updatedAt: data.updatedAt, _count: { serviceJobs: 0 } };
      setCustomers((current) => [created, ...current]); setDraft(empty); setShowForm(false); setMessage(`${created.customerNumber} created.`);
    } catch (error) { setMessage(`Could not create customer: ${error instanceof Error ? error.message : 'Unknown error'}`); }
    finally { lock.current = false; setBusy(false); }
  }

  return <>
    <form className="admin-page-actions">
      <label className="admin-search"><Search size={17} /><span className="sr-only"><ControlText value={"Search customers"}/></span><input name="q" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, company, email or number" /></label>
      <label><ControlText value={"Status filter"}/><select name="status" value={status} onChange={e => setStatus(e.target.value)}><option value=""><ControlText value={"All customers"}/></option>{['LEAD','ACTIVE','INACTIVE','ARCHIVED'].map(s => <option key={s}>{s}</option>)}</select></label><label><ControlText value={"Type"}/><select name="type" value={type} onChange={e=>setType(e.target.value)}><option value=""><ControlText value={"All types"}/></option><option value="PERSON"><ControlText value={"Person"}/></option><option value="BUSINESS"><ControlText value={"Business contact"}/></option></select></label><button className="admin-secondary"><ControlText value={"Apply filters"}/></button><Link className="admin-secondary" href="/dashboard/customers"><ControlText value={"Clear filters"}/></Link><button className="admin-primary" type="button" onClick={() => setShowForm((value) => !value)}><Plus size={18} /><ControlText value={"New customer"}/></button>
    </form>
    {message ? <p className="admin-message" aria-live="polite">{message}</p> : null}
    {showForm ? <form className="panel admin-form-grid" onSubmit={createCustomer}>
      <h2 className="admin-span-2"><ControlText value={"New customer"}/></h2>{Object.entries(errors).map(([key, values]) => <p className="admin-span-2" role="alert" key={key}>{key}: {values.join(' ')}</p>)}
      <label><ControlText value={"Type"}/><select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}><option value="PERSON"><ControlText value={"Person"}/></option><option value="BUSINESS"><ControlText value={"Business contact"}/></option></select></label>
      <label><ControlText value={"Status"}/><select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}><option value="LEAD"><ControlText value={"Lead"}/></option><option value="ACTIVE"><ControlText value={"Active"}/></option><option value="INACTIVE"><ControlText value={"Inactive"}/></option></select></label>
      <label><ControlText value={"First name"}/><input value={draft.firstName} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} /></label>
      <label><ControlText value={"Last name"}/><input value={draft.lastName} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} /></label>
      <label><ControlText value={"Company"}/><select value={draft.companyId} onChange={(e) => setDraft({ ...draft, companyId: e.target.value })}><option value=""><ControlText value={"No company"}/></option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label><ControlText value={"Email"}/><input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label>
      <label><ControlText value={"Phone"}/><input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></label>
      <label><ControlText value={"Preferred language"}/><select value={draft.preferredLanguage} onChange={(e) => setDraft({ ...draft, preferredLanguage: e.target.value })}>{['de','en','uk','ru','sk','fr'].map((l) => <option key={l}>{l}</option>)}</select></label>
      <label><ControlText value={"Street"}/><input value={draft.street} onChange={(e) => setDraft({ ...draft, street: e.target.value })} /></label>
      <label><ControlText value={"Postal code"}/><input value={draft.postalCode} onChange={(e) => setDraft({ ...draft, postalCode: e.target.value })} /></label>
      <label><ControlText value={"Country"}/><input maxLength={100} value={draft.country} onChange={e=>setDraft({...draft,country:e.target.value})}/></label>
      <label><ControlText value={"Secondary phone"}/><input maxLength={50} value={draft.secondaryPhone} onChange={e=>setDraft({...draft,secondaryPhone:e.target.value})}/></label>
      <label><ControlText value={"City"}/><input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></label>
      <label><ControlText value={"Source"}/><input value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value })} placeholder="Referral, website…" /></label>
      <label className="admin-span-2"><ControlText value={"Internal general notes"}/><textarea rows={4} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></label>
      <button className="admin-primary admin-span-2" disabled={busy}><ControlText value={"Create customer"}/></button>
    </form> : null}
    <div className="record-grid">{filtered.map((customer) => <Link className="record-card" href={`/dashboard/customers/${customer.id}`} key={customer.id}>
      <span className="record-card__icon"><UserRound size={21} /></span><div><strong>{name(customer)}</strong><small>{customer.customerNumber}{customer.company ? ` · ${customer.company.name}` : ''}</small><span>{customer.email || customer.phone || 'No contact details'}</span></div><div className="record-card__meta"><span className={`status-pill status-${customer.status.toLowerCase()}`}>{customer.status.replace('_', ' ')}</span><small>{customer._count.serviceJobs}<ControlText value={" jobs"}/></small></div>
    </Link>)}</div>
    {!filtered.length ? <div className="panel empty-state"><UserRound /><h2><ControlText value={"No customers found"}/></h2><p><ControlText value={"Create the first customer or change the search."}/></p></div> : null}
  </>;
}
