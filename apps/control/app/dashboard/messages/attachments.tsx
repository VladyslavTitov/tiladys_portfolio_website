'use client';
import {ControlText} from '@/components/control-language';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Attachment = { id: string; filename: string; size: number; width: number; height: number };
export function Attachments({ messageId, attachments }: { messageId: string; attachments: Attachment[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  async function remove(id: string) {
    setPending(true);
    try {
      const response = await fetch(`/api/admin/messages/${messageId}/attachments/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error();
      setStatus('Attachment deleted. The inquiry is retained.'); setConfirmId(null); router.refresh();
    } catch { setStatus('Deletion failed. Please retry.'); }
    finally { setPending(false); }
  }
  if (!attachments.length) return null;
  return <section className="message-attachments" aria-label="Private inquiry images">
    <h3><ControlText value={"Private inquiry images"}/></h3>
    <p role="status">{status}</p>
    {attachments.map((attachment) => {
      const url = `/api/admin/messages/${messageId}/attachments/${attachment.id}`;
      return <figure key={attachment.id}>
        <details><summary><ControlText value={"Preview "}/>{attachment.filename}</summary><Image unoptimized src={url} width={attachment.width} height={attachment.height} alt={`Inquiry attachment: ${attachment.filename}`} style={{ maxWidth: '100%', width: 320, height: 'auto' }} /></details>
        <figcaption>{Math.ceil(attachment.size / 1024)} KB · <a href={`${url}?download=1`}><ControlText value={"Download "}/>{attachment.filename}</a></figcaption>
        {confirmId === attachment.id ? <div><p><ControlText value={"Delete this attachment permanently from the active database?"}/></p><button disabled={pending} onClick={() => remove(attachment.id)}><ControlText value={"Confirm deletion"}/></button><button disabled={pending} onClick={() => setConfirmId(null)}><ControlText value={"Cancel"}/></button></div> : <button onClick={() => setConfirmId(attachment.id)}><ControlText value={"Delete attachment"}/></button>}
      </figure>;
    })}
  </section>;
}
