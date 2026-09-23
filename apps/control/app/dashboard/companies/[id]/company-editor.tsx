'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUnsavedChanges } from '@/lib/use-unsaved-changes';
type Company = { id: string; name: string; email: string | null; phone: string | null; street: string | null; postalCode: string | null; city: string | null; country: string; website: string | null; notes: string | null };
const fields = { name: 'Company name', email: 'Billing email', phone: 'Phone', street: 'Billing street', postalCode: 'Postal code', city: 'City', country: 'Country (two-letter code)', website: 'Website' };
export function CompanyEditor({ initial }: { initial: Company }) {
  const [draft, setDraft] = useState(initial), [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [errors, setErrors] = useState<Record<string, string[]>>({});
  const lock = useRef(false), router = useRouter(); useUnsavedChanges(JSON.stringify(draft) !== JSON.stringify(saved));
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (lock.current) return; lock.current = true; setBusy(true); setErrors({});
    try { const { id, ...values } = draft; const response = await fetch(`/api/admin/companies/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(Object.entries(values).map(([k,v]) => [k,v ?? '']))) }); const data = await response.json(); if (!response.ok) { setErrors(data.details?.fieldErrors ?? {}); throw new Error(data.error); } setSaved(draft); setMessage('Company saved. Existing invoice snapshots are preserved.'); router.refresh(); }
    catch (error) { setMessage(`Could not save: ${error instanceof Error ? error.message : 'Unknown error'}`); } finally { lock.current = false; setBusy(false); }
  }
  return <form className="panel admin-form-grid" onSubmit={save}><h2 className="admin-span-2">Business & billing information</h2>{Object.entries(fields).map(([key,label]) => <label key={key}>{label}<input value={draft[key as keyof Company] ?? ''} onChange={e => setDraft({ ...draft, [key]: e.target.value })} required={key === 'name' || key === 'country'} type={key === 'email' ? 'email' : 'text'} aria-invalid={Boolean(errors[key])} />{errors[key] ? <span role="alert">{errors[key].join(' ')}</span> : null}</label>)}<label className="admin-span-2">Internal company notes<textarea rows={4} value={draft.notes ?? ''} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></label><button className="admin-primary" disabled={busy}>Save company</button><p role="status">{message}</p></form>;
}
