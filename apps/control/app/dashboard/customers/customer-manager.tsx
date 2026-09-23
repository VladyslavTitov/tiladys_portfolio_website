'use client';

import Link from 'next/link';
import { useUnsavedChanges } from '@/lib/use-unsaved-changes';
import { useMemo, useRef, useState } from 'react';
import { Plus, Search, UserRound } from 'lucide-react';

type Company = { id: string; name: string };
type Customer = { id: string; customerNumber: string; type: string; status: string; firstName: string | null; lastName: string | null; email: string | null; phone: string | null; updatedAt: string; company: Company | null; _count: { serviceJobs: number } };
const empty = { type: 'PERSON', status: 'LEAD', firstName: '', lastName: '', companyId: '', email: '', phone: '', secondaryPhone: '', street: '', postalCode: '', city: '', country: 'DE', preferredLanguage: 'de', source: '', notes: '' };

export function CustomerManager({ initialCustomers, companies }: { initialCustomers: Customer[]; companies: Company[] }) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(empty);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false); const [errors, setErrors] = useState<Record<string, string[]>>({}); const [status, setStatus] = useState('');
  useUnsavedChanges(JSON.stringify(draft) !== JSON.stringify(empty));
  const filtered = useMemo(() => customers.filter((c) => (!status || c.status === status) && `${c.customerNumber} ${c.firstName ?? ''} ${c.lastName ?? ''} ${c.company?.name ?? ''} ${c.email ?? ''}`.toLowerCase().includes(query.toLowerCase())), [customers, query, status]);

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
    <div className="admin-page-actions">
      <label className="admin-search"><Search size={17} /><span className="sr-only">Search customers</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, company, email or number" /></label>
      <label>Status filter<select value={status} onChange={e => setStatus(e.target.value)}><option value="">All customers</option>{['LEAD','ACTIVE','INACTIVE','ARCHIVED'].map(s => <option key={s}>{s}</option>)}</select></label><button className="admin-primary" type="button" onClick={() => setShowForm((value) => !value)}><Plus size={18} />New customer</button>
    </div>
    {message ? <p className="admin-message" aria-live="polite">{message}</p> : null}
    {showForm ? <form className="panel admin-form-grid" onSubmit={createCustomer}>
      <h2 className="admin-span-2">New customer</h2>{Object.entries(errors).map(([key, values]) => <p className="admin-span-2" role="alert" key={key}>{key}: {values.join(' ')}</p>)}
      <label>Type<select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}><option value="PERSON">Person</option><option value="BUSINESS">Business contact</option></select></label>
      <label>Status<select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}><option value="LEAD">Lead</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
      <label>First name<input value={draft.firstName} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} /></label>
      <label>Last name<input value={draft.lastName} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} /></label>
      <label>Company<select value={draft.companyId} onChange={(e) => setDraft({ ...draft, companyId: e.target.value })}><option value="">No company</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Email<input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label>
      <label>Phone<input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></label>
      <label>Preferred language<select value={draft.preferredLanguage} onChange={(e) => setDraft({ ...draft, preferredLanguage: e.target.value })}>{['de','en','uk','ru','sk','fr'].map((l) => <option key={l}>{l}</option>)}</select></label>
      <label>Street<input value={draft.street} onChange={(e) => setDraft({ ...draft, street: e.target.value })} /></label>
      <label>Postal code<input value={draft.postalCode} onChange={(e) => setDraft({ ...draft, postalCode: e.target.value })} /></label>
      <label>City<input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></label>
      <label>Source<input value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value })} placeholder="Referral, website…" /></label>
      <label className="admin-span-2">Internal general notes<textarea rows={4} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></label>
      <button className="admin-primary admin-span-2" disabled={busy}>Create customer</button>
    </form> : null}
    <div className="record-grid">{filtered.map((customer) => <Link className="record-card" href={`/dashboard/customers/${customer.id}`} key={customer.id}>
      <span className="record-card__icon"><UserRound size={21} /></span><div><strong>{name(customer)}</strong><small>{customer.customerNumber}{customer.company ? ` · ${customer.company.name}` : ''}</small><span>{customer.email || customer.phone || 'No contact details'}</span></div><div className="record-card__meta"><span className={`status-pill status-${customer.status.toLowerCase()}`}>{customer.status.replace('_', ' ')}</span><small>{customer._count.serviceJobs} jobs</small></div>
    </Link>)}</div>
    {!filtered.length ? <div className="panel empty-state"><UserRound /><h2>No customers found</h2><p>Create the first customer or change the search.</p></div> : null}
  </>;
}
