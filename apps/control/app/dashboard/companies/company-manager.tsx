'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import { useUnsavedChanges } from '@/lib/use-unsaved-changes';
type Company = { id: string; name: string; email: string | null; phone: string | null; city: string | null; _count: { customers: number; serviceJobs: number } };
const empty = { name: '', email: '', phone: '', street: '', postalCode: '', city: '', country: 'DE', website: '', notes: '' };
const labels = { name: 'Company name', email: 'Billing email', phone: 'Phone', street: 'Billing street', postalCode: 'Postal code', city: 'City', country: 'Country (two-letter code)', website: 'Website' };
export function CompanyManager({ initial }: { initial: Company[] }) {
  const [items, setItems] = useState(initial), [show, setShow] = useState(false), [message, setMessage] = useState('');
  const [draft, setDraft] = useState(empty), [search, setSearch] = useState(''), [filter, setFilter] = useState('');
  const [busy, setBusy] = useState(false), [errors, setErrors] = useState<Record<string, string[]>>({}); const lock = useRef(false);
  useUnsavedChanges(JSON.stringify(draft) !== JSON.stringify(empty));
  async function create(event: React.FormEvent) {
    event.preventDefault(); if (lock.current) return; lock.current = true; setBusy(true); setErrors({});
    try { const response = await fetch('/api/admin/companies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) }); const data = await response.json(); if (!response.ok) { setErrors(data.details?.fieldErrors ?? {}); throw new Error(data.error); } setItems(rows => [...rows, { ...data, _count: { customers: 0, serviceJobs: 0 } }].sort((a,b) => a.name.localeCompare(b.name))); setShow(false); setDraft(empty); setMessage('Company created. Open its profile to manage billing details, contacts and work.'); }
    catch (error) { setMessage(`Could not create company: ${error instanceof Error ? error.message : 'Unknown error'}`); } finally { lock.current = false; setBusy(false); }
  }
  const filtered = items.filter(c => `${c.name} ${c.city ?? ''} ${c.email ?? ''}`.toLowerCase().includes(search.toLowerCase()) && (!filter || (filter === 'contacts' ? c._count.customers > 0 : c._count.serviceJobs > 0)));
  return <><div className="admin-page-actions"><label>Search companies<input value={search} onChange={e => setSearch(e.target.value)} /></label><label>Show<select value={filter} onChange={e => setFilter(e.target.value)}><option value="">All companies</option><option value="contacts">With contacts</option><option value="jobs">With jobs</option></select></label><button className="admin-primary" onClick={() => setShow(v => !v)}><Plus size={17} />New company</button></div><p role="status">{message}</p>
    {show ? <form className="panel admin-form-grid" onSubmit={create}><h2 className="admin-span-2">New company</h2>{Object.entries(labels).map(([key,label]) => <label key={key}>{label}<input required={key === 'name'} type={key === 'email' ? 'email' : 'text'} value={draft[key as keyof typeof draft]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} aria-invalid={Boolean(errors[key])} />{errors[key] ? <span role="alert">{errors[key].join(' ')}</span> : null}</label>)}<label className="admin-span-2">Internal notes<textarea value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></label><button className="admin-primary admin-span-2" disabled={busy}>Create company</button></form> : null}
    <div className="record-grid">{filtered.map(c => <Link className="record-card" href={`/dashboard/companies/${c.id}`} key={c.id}><span className="record-card__icon"><Building2 /></span><div><strong>{c.name}</strong><small>{c.city || 'No address'} · {c.email || c.phone || 'No contact details'}</small></div><div className="record-card__meta"><span>{c._count.customers} contacts</span><small>{c._count.serviceJobs} jobs</small></div></Link>)}</div>{!filtered.length ? <div className="panel empty-state"><h2>No companies found</h2><p>Create a company or change the search and filters.</p></div> : null}</>;
}
