'use client';
import {ControlText} from '@/components/control-language';


import { adminDateTime } from '@/lib/admin-dates';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Attachments } from './attachments';
import {EnquiryLink} from './enquiry-link';
import { ReplyForm } from './reply-form';
import { useUnsavedChanges } from '@/lib/use-unsaved-changes';

type MessageRow = {
  attachments: Array<{ id: string; filename: string; size: number; width: number; height: number }>;
  id: string;
  name: string;
  email: string;
  service: string | null;
  locale: string; requestMode?:string|null;replyLanguage?:string|null;phone?:string|null;publicReference?:string|null;
  message: string;
  status: string;
  createdAt: string;
};

export function MessageList({ messages, initialDetailOpen = false }: { messages: MessageRow[]; initialDetailOpen?: boolean }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [selectedId, setSelectedId] = useState(messages[0]?.id ?? '');
  const [detailOpen, setDetailOpen] = useState(initialDetailOpen);
  const [replyDirty, setReplyDirty] = useState(false);
  const [replyBusy, setReplyBusy] = useState(false);
  const [enquiryDirty, setEnquiryDirty] = useState(false);
  const [enquiryBusy, setEnquiryBusy] = useState(false);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  useUnsavedChanges(replyDirty || enquiryDirty);
  const message = messages.find(row => row.id === selectedId) ?? messages[0];
  function select(id: string) {
    if (replyBusy || enquiryBusy) return;
    if (id !== message?.id && (replyDirty || enquiryDirty) && !confirm('Discard unsaved message changes?')) return;
    if (id !== message?.id) {setReplyDirty(false);setEnquiryDirty(false);}
    setSelectedId(id); setDetailOpen(true);
    requestAnimationFrame(() => detailHeading.current?.focus({preventScroll: true}));
  }

  async function setStatus(id: string, status: 'UNREAD' | 'READ' | 'ARCHIVED' | 'SPAM') {
    if (pendingId || replyBusy || enquiryBusy) return;
    if ((replyDirty || enquiryDirty) && !confirm('Changing status may remove this message from the current list and discard unsaved changes. Continue?')) return;
    if(['ARCHIVED','SPAM'].includes(status) && !confirm(`Mark this enquiry ${status.toLowerCase()}? It remains available in its status filter.`)) return;
    setPendingId(id);
    setFeedback('');
    try {
      const response = await fetch(`/api/admin/messages/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Request failed');
      setFeedback(`Message marked ${status.toLowerCase()}.`);
      router.refresh();
    } catch {
      setFeedback('Could not update the message status.');
    } finally {
      setPendingId(null);
    }
  }

  if (!messages.length) return <section className="panel"><p><ControlText value={"No messages received yet."}/></p></section>;

  return (
    <section className="message-list" aria-label="Contact messages">
      <p className="admin-message" aria-live="polite">{feedback}</p>
      <div className={`inbox-layout${detailOpen ? ' is-detail-open' : ''}`}>
        <div className="panel inbox-list" aria-label="Contact messages">
          {messages.map(row => <button type="button" className="inbox-message" data-message-id={row.id} key={row.id} aria-pressed={row.id === message.id} disabled={replyBusy || enquiryBusy || Boolean(pendingId)} onClick={() => select(row.id)}>
            <span className="inbox-message__heading"><strong>{row.name}</strong><span className="status-pill">{row.status}</span></span>
            <span>{row.email}</span><span className="inbox-message__preview">{row.message.length > 140 ? `${row.message.slice(0,140)}…` : row.message}</span>
            <time dateTime={row.createdAt}>{adminDateTime(row.createdAt)}</time>
          </button>)}
        </div>
          <article className={`panel message inbox-detail message--${message.status === 'UNREAD' ? 'unread' : 'read'}`}>
            <button className="admin-secondary inbox-back" type="button" disabled={replyBusy || enquiryBusy || Boolean(pendingId)} onClick={() => {setDetailOpen(false);requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>(`.inbox-message[data-message-id="${CSS.escape(message.id)}"]`)?.focus());}}><ControlText value="Back to list"/></button>
            <header>
              <div><h2 ref={detailHeading} tabIndex={-1}>{message.name}</h2><a href={`mailto:${message.email}`}>{message.email}</a></div>
              <time dateTime={message.createdAt}>{adminDateTime(message.createdAt)}</time>
              <span className={`message-status message-status--${message.status === 'UNREAD' ? 'unread' : 'read'}`}>{message.status}</span>
            </header>
            <div className="message-meta">
              {message.service ? <span><ControlText value={"Service: "}/>{message.service}</span> : null}
              <span><ControlText value={"UI locale: "}/>{message.locale}</span>{message.replyLanguage?<span><ControlText value={"Preferred reply language: "}/>{message.replyLanguage}</span>:null}{message.requestMode?<span><ControlText value={"Request mode: "}/>{message.requestMode}</span>:null}{message.phone?<span><ControlText value={"Phone: "}/>{message.phone}</span>:null}{message.publicReference?<span><ControlText value={"Public reference: "}/>{message.publicReference}</span>:null}
            </div>
            <p className="message-full-text">{message.message}</p>
            <div className="message-actions">
              <button type="button" className="admin-secondary" disabled={pendingId === message.id || message.status === 'UNREAD'} onClick={() => setStatus(message.id, 'UNREAD')}><ControlText value={"Mark unread"}/></button>
              <button type="button" className="admin-primary" disabled={pendingId === message.id || message.status === 'READ'} onClick={() => setStatus(message.id, 'READ')}><ControlText value={"Mark read"}/></button>
              <button type="button" className="admin-secondary" disabled={pendingId===message.id} onClick={()=>setStatus(message.id,'ARCHIVED')}><ControlText value={"Archive"}/></button><button type="button" className="admin-secondary" disabled={pendingId===message.id} onClick={()=>setStatus(message.id,'SPAM')}><ControlText value={"Mark spam"}/></button>
            </div>
            <EnquiryLink key={`link-${message.id}`} onDirtyChange={setEnquiryDirty} onPendingChange={setEnquiryBusy} phone={message.phone||''} preferredLocale={message.replyLanguage||message.locale} message={message.message} id={message.id} name={message.name} email={message.email}/>
            <Attachments messageId={message.id} attachments={message.attachments} />
            <ReplyForm key={message.id} id={message.id} email={message.email} preferredLocale={message.replyLanguage||message.locale} onDirtyChange={setReplyDirty} onPendingChange={setReplyBusy} />
          </article>
      </div>
    </section>
  );
}
