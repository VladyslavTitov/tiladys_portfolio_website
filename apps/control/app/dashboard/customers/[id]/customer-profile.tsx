'use client';

import { adminDateTime } from '@/lib/admin-dates';

import Link from 'next/link';
import { ProfileInvoices, type ProfileInvoice } from '../../invoices/profile-invoices';
import { useUnsavedChanges } from '@/lib/use-unsaved-changes';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Archive, BriefcaseBusiness, FileImage, Save, StickyNote } from 'lucide-react';

type Company = { id: string; name: string };
type Note = { id: string; body: string; createdAt: string; createdBy: { displayName: string } };
type Activity = { id: string; type: string; summary: string; createdAt: string; createdBy: { displayName: string } | null };
type Job = { id: string; jobNumber: string; title: string; status: string; serviceDate: string | null; finalPrice: string | null };
type Invoice = ProfileInvoice;
type FileSummary = { id: string; filename: string; kind: string; createdAt: string };
type Customer = { id: string; customerNumber: string; type: string; status: string; firstName: string | null; lastName: string | null; companyId: string | null; email: string | null; phone: string | null; secondaryPhone: string | null; street: string | null; postalCode: string | null; city: string | null; country: string; preferredLanguage: string; source: string | null; notes: string | null; company: Company | null; customerNotes: Note[]; activities: Activity[]; serviceJobs: Job[]; invoices: Invoice[]; files: FileSummary[] };

export function CustomerProfile({ initial, companies }: { initial: Customer; companies: Company[] }) {
  const [customer, setCustomer] = useState(initial); const [notes, setNotes] = useState(initial.customerNotes); const [note, setNote] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  const lock = useRef(false); const [errors, setErrors] = useState<Record<string, string[]>>({});
  const router = useRouter(); const [saved, setSaved] = useState(initial);
  useUnsavedChanges(JSON.stringify(customer) !== JSON.stringify(saved) || Boolean(note));
  const set = (key: keyof Customer, value: unknown) => setCustomer((current) => ({ ...current, [key]: value }));
  const payload = () => ({ type: customer.type, status: customer.status, firstName: customer.firstName ?? '', lastName: customer.lastName ?? '', companyId: customer.companyId ?? '', email: customer.email ?? '', phone: customer.phone ?? '', secondaryPhone: customer.secondaryPhone ?? '', street: customer.street ?? '', postalCode: customer.postalCode ?? '', city: customer.city ?? '', country: customer.country, preferredLanguage: customer.preferredLanguage, source: customer.source ?? '', notes: customer.notes ?? '' });
  async function save() { if (lock.current) return; lock.current = true; setErrors({}); setBusy(true); setMessage('Saving…'); try { const response = await fetch(`/api/admin/customers/${customer.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload()) }); const data = await response.json(); if (!response.ok) { setErrors(data.details?.fieldErrors ?? {}); throw new Error(data.error); } setCustomer((c) => ({ ...c, ...data })); setSaved({ ...customer, ...data }); router.refresh(); setMessage('Customer saved.'); } catch (e) { setMessage(`Could not save: ${e instanceof Error ? e.message : 'Unknown error'}`); } finally { lock.current = false; setBusy(false); } }
  async function archive() { if (lock.current) return; if (!confirm('Archive this customer? Existing jobs and history are preserved.')) return; lock.current = true; setBusy(true); try { const response = await fetch(`/api/admin/customers/${customer.id}`, { method: 'DELETE' }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setCustomer((c) => ({ ...c, status: 'ARCHIVED' })); setSaved(c => ({ ...c, status: 'ARCHIVED' })); router.refresh(); setMessage('Customer archived.'); } catch (e) { setMessage(`Could not archive: ${e instanceof Error ? e.message : 'Unknown error'}`); } finally { lock.current = false; setBusy(false); } }
  async function addNote(e: React.FormEvent) { e.preventDefault(); if (!note.trim() || lock.current) return; lock.current = true; setBusy(true); try { const response = await fetch(`/api/admin/customers/${customer.id}/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: note }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setNotes((n) => [data, ...n]); setNote(''); router.refresh(); setMessage('Private note added.'); } catch (error) { setMessage(`Could not add note: ${error instanceof Error ? error.message : 'Unknown error'}`); } finally { lock.current = false; setBusy(false); } }
  return <>
    <div className="profile-hero"><div><span className="eyebrow">{customer.customerNumber}</span><h1>{[customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.company?.name || 'Customer'}</h1><p>{customer.company ? <Link href={`/dashboard/companies/${customer.company.id}`}>{customer.company.name}</Link> : 'Individual customer'} · <span className={`status-pill status-${customer.status.toLowerCase()}`}>{customer.status}</span></p></div><div className="profile-actions"><button className="admin-secondary" onClick={archive} disabled={busy || customer.status === 'ARCHIVED'}><Archive size={17} />Archive</button><button className="admin-primary" onClick={save} disabled={busy}><Save size={17} />Save</button></div></div>
    {message ? <p className="admin-message" aria-live="polite">{message}</p> : null}
    {Object.entries(errors).map(([key, values]) => <p role="alert" key={key}>{key}: {values.join(' ')}</p>)}
    <div className="profile-layout"><section className="panel"><h2>Contact & profile</h2><div className="admin-form-grid">
      <label>Type<select value={customer.type} onChange={(e) => set('type', e.target.value)}><option value="PERSON">Person</option><option value="BUSINESS">Business contact</option></select></label><label>Status<select value={customer.status} onChange={(e) => set('status', e.target.value)}>{['LEAD','ACTIVE','INACTIVE','ARCHIVED'].map((v) => <option key={v}>{v}</option>)}</select></label>
      <label>First name<input value={customer.firstName ?? ''} onChange={(e) => set('firstName', e.target.value)} /></label><label>Last name<input value={customer.lastName ?? ''} onChange={(e) => set('lastName', e.target.value)} /></label>
      <label>Company<select value={customer.companyId ?? ''} onChange={(e) => set('companyId', e.target.value)}><option value="">No company</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Email<input type="email" value={customer.email ?? ''} onChange={(e) => set('email', e.target.value)} /></label>
      <label>Phone<input value={customer.phone ?? ''} onChange={(e) => set('phone', e.target.value)} /></label><label>Secondary phone<input value={customer.secondaryPhone ?? ''} onChange={(e) => set('secondaryPhone', e.target.value)} /></label>
      <label>Street<input value={customer.street ?? ''} onChange={(e) => set('street', e.target.value)} /></label><label>Postal code<input value={customer.postalCode ?? ''} onChange={(e) => set('postalCode', e.target.value)} /></label><label>City<input value={customer.city ?? ''} onChange={(e) => set('city', e.target.value)} /></label><label>Language<select value={customer.preferredLanguage} onChange={(e) => set('preferredLanguage', e.target.value)}>{['de','en','uk','ru','sk','fr'].map((l) => <option key={l}>{l}</option>)}</select></label>
      <label className="admin-span-2">Internal general notes<textarea rows={5} value={customer.notes ?? ''} onChange={(e) => set('notes', e.target.value)} /></label>
    </div></section>
    <aside><section className="panel"><h2>Service jobs</h2><Link className="admin-primary full-button" href={`/dashboard/service-jobs?customerId=${customer.id}`}><BriefcaseBusiness size={17} />Create service job</Link>{customer.serviceJobs.length ? <div className="compact-list">{customer.serviceJobs.map((job) => <Link href={`/dashboard/service-jobs?jobId=${job.id}`} key={job.id}><strong>{job.title}</strong><span>{job.jobNumber} · {job.status.replace('_',' ')}</span><span>Create invoice from job →</span></Link>)}</div> : <p>No service jobs yet.</p>}</section>

    <section className="panel"><h2><FileImage size={18} /> Photos & files</h2>{customer.files.length ? <p>{customer.files.length} private file records.</p> : <p>No private files. Upload remains disabled until private storage is configured.</p>}</section>
    <section className="panel"><h2><StickyNote size={18} /> Private notes</h2><form className="note-form" onSubmit={addNote}><textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a dated internal note" /><button className="admin-primary" disabled={busy}>Add note</button></form><div className="timeline">{notes.map((n) => <article key={n.id}><p>{n.body}</p><small>{adminDateTime(n.createdAt)} · {n.createdBy.displayName}</small></article>)}</div></section></aside></div>
    <ProfileInvoices invoices={initial.invoices} />
    <section className="panel"><h2>Activity</h2><div className="timeline">{initial.activities.map((a) => <article key={a.id}><strong>{a.summary}</strong><small>{adminDateTime(a.createdAt)} · {a.createdBy?.displayName ?? 'System'}</small></article>)}</div></section>
  </>;
}
