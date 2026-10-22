'use client';
import {ControlText} from '@/components/control-language';

import { useState,useRef } from 'react';
export function ReplyForm({ id, email,preferredLocale,onDirtyChange,onPendingChange }: { id: string; email: string;preferredLocale:string;onDirtyChange?:(dirty:boolean)=>void;onPendingChange?:(pending:boolean)=>void }) {
  const attempt=useRef<{reply:string;key:string}|null>(null);
  const [locale,setLocale]=useState(preferredLocale);
  const [reviewed,setReviewed]=useState(false);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !reviewed) return;
    const form = event.currentTarget;
    setPending(true);
    onPendingChange?.(true);
    try {
      const reply=String(new FormData(form).get('reply'));if(!attempt.current||attempt.current.reply!==`${locale}:${reply}`)attempt.current={reply:`${locale}:${reply}`,key:crypto.randomUUID()};
      const response = await fetch(`/api/admin/messages/${id}/reply`, { method: 'POST', headers: { 'Content-Type': 'application/json','Idempotency-Key':attempt.current.key }, body: JSON.stringify({ reply, locale }) });
      const result = await response.json();
      setMessage(response.ok ? 'Reply accepted by SMTP.' : result.error || 'Reply failed. Your draft has been kept.');
      if (response.ok) {form.reset();attempt.current=null;onDirtyChange?.(false);}
    } catch { setMessage('Connection failed. Check delivery before retrying. Your draft has been kept.'); }
    finally { setPending(false);onPendingChange?.(false); }
  }
  return <form className="reply" onSubmit={submit}><fieldset className="reply-fields" disabled={pending}><label><ControlText value={"Reply to "}/>{email}<textarea name="reply" onChange={e=>{setReviewed(false);onDirtyChange?.(Boolean(e.target.value));}} required minLength={2} maxLength={10000} /></label><label><ControlText value={"Reply language"}/><select value={locale} onChange={e=>{setLocale(e.target.value);setReviewed(false);}}>{['en','de','uk','ru','sk','fr'].map(l=><option key={l}>{l}</option>)}</select></label><label className="admin-checkbox"><input type="checkbox" checked={reviewed} onChange={e=>setReviewed(e.target.checked)}/><ControlText value={"I reviewed this recipient, language and reply before sending."}/></label><button className="admin-primary" disabled={pending||!reviewed}><ControlText value={pending ? 'Sending…' : 'Send reply'}/></button></fieldset><span role="status">{message}</span></form>;
}
