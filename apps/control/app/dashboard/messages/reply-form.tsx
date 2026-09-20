'use client';
import { useState } from 'react';
export function ReplyForm({ id, email }: { id: string; email: string }) {
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    setPending(true);
    try {
      const response = await fetch(`/api/admin/messages/${id}/reply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reply: String(new FormData(form).get('reply')) }) });
      const result = await response.json();
      setMessage(response.ok ? 'Reply accepted by SMTP.' : result.error || 'Reply failed. Your draft has been kept.');
      if (response.ok) form.reset();
    } catch { setMessage('Connection failed. Check delivery before retrying. Your draft has been kept.'); }
    finally { setPending(false); }
  }
  return <form className="reply" onSubmit={submit}><label>Reply to {email}<textarea name="reply" required minLength={2} maxLength={10000} /></label><button disabled={pending}>{pending ? 'Sending…' : 'Send reply'}</button><span role="status">{message}</span></form>;
}
